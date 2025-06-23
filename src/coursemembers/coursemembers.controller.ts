import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Query } from '@nestjs/common';
import { CousemembersService } from './coursemembers.service';
import { CreateCousememberDto } from './dto/create-coursemembers.dto';
import { UpdateCousememberDto } from './dto/update-coursemembers.dto';
import { User } from 'src/users/entities/user.entity';
import { PageOptionsDto } from 'src/common/paginations/dtos/page-option-dto';
import { CourseMember } from './entities/cousemember.entity';

@Controller('cousemembers')
export class CousemembersController {
  constructor(private readonly cousemembersService: CousemembersService) { }

  @Post()
  create(@Body() createCousememberDto: CreateCousememberDto, @Req() request: Request) {
    const user: User = request['user'] ?? null;
    return this.cousemembersService.create(createCousememberDto, user);
  }

  @Get()
  findAll(@Query() pageOptionDto: PageOptionsDto, @Query() query: Partial<CourseMember>) {
    return this.cousemembersService.findAll(pageOptionDto, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cousemembersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCousememberDto: UpdateCousememberDto) {
    return this.cousemembersService.update(+id, updateCousememberDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cousemembersService.remove(+id);
  }
}
