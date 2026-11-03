import {
  BadRequestException,
  ForbiddenException,
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
          website: dto.website || null,
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

  /** Міняти й видаляти компанію може лише її власник. */
  private async assertOwner(id: string, ownerId?: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      select: { ownerId: true },
    });
    if (!company) throw new NotFoundException('Entreprise introuvable.');
    if (company.ownerId !== ownerId) {
      throw new ForbiddenException("Cette entreprise ne vous appartient pas.");
    }
  }

  async update(id: string, dto: CreateCompanyDto) {
    await this.assertOwner(id, dto.ownerId);

    // Транзакція: або все оновлено, або нічого.
    return this.prisma.$transaction(async (tx) => {
      const company = await tx.company.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description || null,
          // У формі цих двох полів немає: undefined лишає те, що в базі.
          sector: dto.sector,
          region: dto.region,
          size: dto.size ?? null,
          logoUrl: dto.logoUrl || null,
          website: dto.website || null,
          foundedOn: dto.foundedOn ? new Date(dto.foundedOn) : null,
        },
        select: { id: true, name: true, createdAt: true },
      });

      if (dto.offres) {
        const existing = await tx.offre.findMany({
          where: { companyId: id },
          select: { id: true },
        });
        const known = new Set(existing.map((offre) => offre.id));
        const keep = dto.offres
          .map((offre) => offre.id)
          .filter((offreId): offreId is string => !!offreId && known.has(offreId));

        await tx.offre.deleteMany({
          where: { companyId: id, id: { notIn: keep } },
        });

        for (const offre of dto.offres) {
          // metier / region / contract форма не показує, тож їх не чіпаємо.
          const data = {
            title: offre.title,
            description: offre.description || null,
            type: offre.type ?? 'EMPLOI',
            skills: this.skills.keepKnown(offre.skills ?? []),
          };

          if (offre.id && known.has(offre.id)) {
            await tx.offre.update({ where: { id: offre.id }, data });
          } else {
            await tx.offre.create({ data: { ...data, companyId: id } });
          }
        }
      }

      if (dto.nodes) {
        // Дерево простіше зібрати заново: на вузли ніхто інший не посилається.
        await tx.orgChart.deleteMany({ where: { companyId: id } });

        if (dto.nodes.length) {
          const chart = await tx.orgChart.create({
            data: { name: dto.name, companyId: id },
            select: { id: true },
          });
          await insertNodes(tx, chart.id, null, dto.nodes);
        }
      }

      return company;
    });
  }

  async remove(id: string, ownerId?: string) {
    await this.assertOwner(id, ownerId);

    return this.prisma.company.delete({
      where: { id },
      select: { id: true, name: true },
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
        website: true,
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
            skills: true,
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

  findAll(search?: string, ownerId?: string) {
    return this.prisma.company.findMany({
      where: {
        ...(search
          ? { name: { contains: search, mode: 'insensitive' as const } }
          : {}),
        ...(ownerId ? { ownerId } : {}),
      },
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
