import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SkillsService } from '../skills/skills.service';
import { Prisma } from '../generated/prisma/client';
import { CreateCompanyDto, OrgNodeDto } from './dto/create-company.dto';

/**
 * Вставляє дерево рівень за рівнем.
 * Вкладений `create` тут не годиться: кожен OrgNode обовʼязково належить
 * організограмі, а Prisma не проносить chartId у глибину.
 */
async function insertNodes(
  tx: Prisma.TransactionClient,
  chartId: string,
  parentId: string | null,
  nodes: OrgNodeDto[],
) {
  for (const node of nodes) {
    const created = await tx.orgNode.create({
      data: {
        name: node.name,
        role: node.role || null,
        telephone: node.telephone || null,
        email: node.email || null,
        chartId,
        parentId,
      },
      select: { id: true },
    });

    if (node.children?.length) {
      await insertNodes(tx, chartId, created.id, node.children);
    }
  }
}

type FlatNode = {
  id: string;
  name: string;
  role: string | null;
  telephone: string | null;
  email: string | null;
  parentId: string | null;
};

type TreeNode = Omit<FlatNode, 'parentId'> & { children: TreeNode[] };

/** Складає дерево з плаского списку за parentId. */
function buildTree(flat: FlatNode[]): TreeNode[] {
  const byId = new Map<string, TreeNode>();
  for (const node of flat) {
    const { parentId: _drop, ...rest } = node;
    byId.set(node.id, { ...rest, children: [] });
  }

  const roots: TreeNode[] = [];
  for (const node of flat) {
    const built = byId.get(node.id)!;
    const parent = node.parentId ? byId.get(node.parentId) : null;
    if (parent) parent.children.push(built);
    else roots.push(built);
  }

  return roots;
}

@Injectable()
export class CompaniesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly skills: SkillsService,
  ) {}

  async create(dto: CreateCompanyDto) {
    const owner = await this.prisma.user.findUnique({
      where: { id: dto.ownerId },
      select: { id: true },
    });
    if (!owner) throw new BadRequestException('Utilisateur inconnu.');

    // Транзакція: або компанія з усім деревом, або нічого.
    return this.prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: dto.name,
          description: dto.description || null,
          sector: dto.sector || null,
          region: dto.region || null,
          size: dto.size ?? null,
          logoUrl: dto.logoUrl || null,
          foundedOn: dto.foundedOn ? new Date(dto.foundedOn) : null,
          ownerId: owner.id,
          // Пропозиції — простий список, тому вкладеного create вистачає.
          offres: dto.offres?.length
            ? {
                create: dto.offres.map((offre) => ({
                  title: offre.title,
                  description: offre.description || null,
                  type: offre.type ?? 'EMPLOI',
                  metier: offre.metier || null,
                  region: offre.region || null,
                  contract: offre.contract ?? null,
                  // Вигадані id відкидаємо тут, а не в базі.
                  skills: this.skills.keepKnown(offre.skills ?? []),
                })),
              }
            : undefined,
        },
        select: { id: true, name: true, createdAt: true },
      });

      if (dto.nodes?.length) {
        const chart = await tx.orgChart.create({
          data: { name: dto.name, companyId: company.id },
          select: { id: true },
        });
        await insertNodes(tx, chart.id, null, dto.nodes);
      }

      return company;
    });
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        sector: true,
        region: true,
        size: true,
        logoUrl: true,
        foundedOn: true,
        createdAt: true,
        owner: { select: { email: true } },
        offres: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            contract: true,
            metier: true,
            region: true,
          },
        },
        orgCharts: {
          select: {
            id: true,
            name: true,
            // Дістаємо вузли пласким списком одним запитом.
            // Рекурсивний include Prisma не вміє — дерево збираємо нижче.
            nodes: {
              select: {
                id: true,
                name: true,
                role: true,
                telephone: true,
                email: true,
                parentId: true,
              },
            },
          },
        },
      },
    });

    if (!company) throw new NotFoundException('Entreprise introuvable.');

    return {
      ...company,
      orgCharts: company.orgCharts.map((chart) => ({
        id: chart.id,
        name: chart.name,
        nodes: buildTree(chart.nodes),
      })),
    };
  }

  findAll(search?: string) {
    return this.prisma.company.findMany({
      where: search
        ? { name: { contains: search, mode: 'insensitive' } }
        : undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        sector: true,
        region: true,
        size: true,
        logoUrl: true,
        createdAt: true,
        _count: { select: { offres: true, orgCharts: true } },
      },
    });
  }
}
