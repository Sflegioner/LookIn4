import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { FormationsService } from './formations.service';
import { CreateFormationDto } from './dto/create-formation.dto';

@Controller('formations')
export class FormationsController {
  constructor(private readonly formationsService: FormationsService) {}

  @Post()
  create(@Body() dto: CreateFormationDto) {
    return this.formationsService.create(dto);
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('skill') skill?: string,
    @Query('ownerId') ownerId?: string,
  ) {
    return this.formationsService.findAll({
      search,
      category,
      skill,
      ownerId,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.formationsService.findOne(id);
  }

  // Форма надсилає всі поля, тож оновлення — повна заміна, а не часткове.
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: CreateFormationDto) {
    return this.formationsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query('ownerId') ownerId?: string) {
    return this.formationsService.remove(id, ownerId);
  }
}
