import { Controller, Get, Param, Query } from '@nestjs/common';
import { OffresService } from './offres.service';

@Controller('offres')
export class OffresController {
  constructor(private readonly offresService: OffresService) {}

  // Перед @Get() з параметром — інакше 'facets' поїхало б як фільтр
  @Get('facets')
  facets() {
    return this.offresService.facets();
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('metier') metier?: string,
    @Query('region') region?: string,
    @Query('contract') contract?: string,
  ) {
    return this.offresService.findAll({
      search,
      type,
      metier,
      region,
      contract,
    });
  }

  // Після @Get('facets') — інакше 'facets' поїхало б сюди як :id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.offresService.findOne(id);
  }
}
