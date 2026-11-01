import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CvsService } from './cvs.service';
import { CreateCvDto } from './dto/create-cv.dto';
import { UpdateCvDto } from './dto/update-cv.dto';

@Controller('cvs')
export class CvsController {
  constructor(private readonly cvsService: CvsService) {}

  @Post()
  create(@Body() dto: CreateCvDto) {
    return this.cvsService.create(dto);
  }

  // CV у людини один, тож замість списку — «мій CV» або null.
  @Get()
  findMine(@Query('userId') userId?: string) {
    if (!userId) throw new BadRequestException('userId est requis.');

    return this.cvsService.findByUser(userId);
  }

  // Після @Get() — інакше 'userId' міг би поїхати сюди як :id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cvsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCvDto) {
    return this.cvsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cvsService.remove(id);
  }
}
