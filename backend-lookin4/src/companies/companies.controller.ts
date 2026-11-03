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
  findAll(
    @Query('search') search?: string,
    @Query('ownerId') ownerId?: string,
  ) {
    return this.companiesService.findAll(search, ownerId);
  }

  // Після @Get() — інакше 'search' міг би поїхати сюди як :id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  // Форма надсилає всі поля, тож оновлення — повна заміна, а не часткове.
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: CreateCompanyDto) {
    return this.companiesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query('ownerId') ownerId?: string) {
    return this.companiesService.remove(id, ownerId);
  }
}
