import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  create(@Body() dto: CreateCompanyDto) {
    return this.companiesService.create(dto);
  }

  @Get()
  findAll(@Query('search') search?: string) {
    return this.companiesService.findAll(search);
  }

  // Після @Get() — інакше 'search' міг би поїхати сюди як :id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }
}
