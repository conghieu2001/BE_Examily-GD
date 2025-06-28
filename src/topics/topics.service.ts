import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Topic } from './entities/topic.entity';
import { Not, Repository } from 'typeorm';
import { Subject } from 'src/subjects/entities/subject.entity';
import { PageOptionsDto } from 'src/common/paginations/dtos/page-option-dto';
import { PageDto } from 'src/common/paginations/dtos/page.dto';
import { PageMetaDto } from 'src/common/paginations/dtos/page.metadata.dto';

@Injectable()
export class TopicsService {
  constructor(
    @InjectRepository(Topic) private topicRepo: Repository<Topic>,
    @InjectRepository(Subject) private subjectRepo: Repository<Subject>,
  ) { }
  async create(createTopicDto: CreateTopicDto) {
    const { name, subjectId } = createTopicDto
    const checkSubject = await this.subjectRepo.findOne({ where: { id: subjectId } })
    if (!checkSubject) {
      throw new HttpException('Môn học không tồn tại', 404)
    }

    const existingTopic = await this.topicRepo.findOne({
      where: {
        name,
        subject: { id: subjectId }
      }
    })
    if (existingTopic) {
      throw new HttpException(` Chủ đề với tên này đã tồn tại trong môn ${checkSubject.name}`, 400)
    }
    const newTopic = await this.topicRepo.save({
      name,
      subject: checkSubject
    })
    return newTopic
  }

  async findAll(
    pageOptions: PageOptionsDto,
    rawQuery: Record<string, any>,
  ): Promise<PageDto<Topic>> {
    const queryBuilder = this.topicRepo.createQueryBuilder('topic')
      .leftJoinAndSelect('topic.subject', 'subject')

    const { page, take, skip, order, search } = pageOptions;
    const paginationParams = ['page', 'take', 'skip', 'order', 'search'];

    // Lọc theo query (VD: ?subjectId=1)
    Object.keys(rawQuery).forEach(key => {
      if (!paginationParams.includes(key) && rawQuery[key] !== undefined) {
        queryBuilder.andWhere(`topic.${key} = :${key}`, { [key]: rawQuery[key] });
      }
    });

    // Tìm kiếm theo tên topic
    if (search) {
      queryBuilder.andWhere(
        `LOWER(unaccent(topic.name)) ILIKE LOWER(unaccent(:search))`,
        { search: `%${search}%` },
      );
    }

    // Nếu có phân trang
    const hastake = Object.prototype.hasOwnProperty.call(rawQuery, 'take');
    if (hastake) {
      queryBuilder.skip(skip).take(take);
    }

    const itemCount = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();

    return new PageDto(entities, new PageMetaDto({ pageOptionsDto: pageOptions, itemCount }));
  }


  async findOne(id: number) {
    const topic = await this.topicRepo.findOne({
      where: { id },
      relations: ['subject'],
    });

    if (!topic) {
      throw new NotFoundException(`Không tìm thấy chủ đề với ID: ${id}`);
    }

    return topic;
  }

  async update(id: number, updateTopicDto: UpdateTopicDto): Promise<Topic> {
    const { name, subjectId } = updateTopicDto;

    const topic = await this.topicRepo.findOne({
      where: { id },
      relations: ['subject'],
    });

    if (!topic) {
      throw new NotFoundException(`Không tìm thấy chủ đề với ID: ${id}`);
    }

    let subjectEntity = topic.subject;

    if (subjectId && subjectId !== topic.subject.id) {
      const subjectFound = await this.subjectRepo.findOne({ where: { id: subjectId } });
      if (!subjectFound) {
        throw new NotFoundException(`Không tìm thấy môn học với ID: ${subjectId}`);
      }
      subjectEntity = subjectFound;
    }

    if (name !== undefined) {
      // Kiểm tra trùng tên khi name có thay đổi
      const existing = await this.topicRepo.findOne({
        where: {
          id: Not(id),
          name,
          subject: { id: subjectEntity.id },
        },
      });

      if (existing) {
        throw new BadRequestException(`Chủ đề "${name}" đã tồn tại trong môn học "${subjectEntity.name}".`);
      }

      topic.name = name;
    }

    topic.subject = subjectEntity;

    return this.topicRepo.save(topic);
  }
  async remove(id: number) {
    const topic = await this.topicRepo.findOne({
      where: { id },
      relations: ['subject'],
    });

    if (!topic) {
      throw new NotFoundException('Topic không tồn tại');
    }

    await this.topicRepo.softDelete({ id });
    return topic;
  }
}
