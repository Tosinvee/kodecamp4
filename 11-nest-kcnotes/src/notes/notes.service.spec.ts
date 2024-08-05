/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { NotesService } from './notes.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { CreateNoteDto } from './dto/create-note.dto';

describe('NotesService', () => {
  let notesService: NotesService;
  let prismaService: PrismaService;

  const fixedDate = new Date('2024-08-04T16:00:00Z'); // Fixed date for consistency

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotesService,
        {
          provide: PrismaService,
          useValue: {
            note: {
              findUnique: jest.fn(),
              create: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    notesService = module.get<NotesService>(NotesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  const existingNote = {
    id: '1',
    title: 'Test Note',
    content: 'Test Content',
    createdAt: fixedDate,
    updatedAt: fixedDate,
    userId: 'userId',
  };

  const newNoteDto: CreateNoteDto = {
    title: 'New Note',
    content: 'New Content',
  };

  describe('createNote', () => {
    it('should throw error if note already exists', async () => {
      (prismaService.note.findUnique as jest.Mock).mockResolvedValue(existingNote);

      await expect(notesService.createNote(newNoteDto, 'userId')).rejects.toThrow(
        new BadRequestException(`Note with title '${newNoteDto.title}' already exists.`),
      );
    });

    it('should create a new note', async () => {
      (prismaService.note.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.note.create as jest.Mock).mockResolvedValue({
        ...newNoteDto,
        id: '1',
        createdAt: fixedDate,
        updatedAt: fixedDate,
        userId: 'userId',
      });

      const result = await notesService.createNote(newNoteDto, 'userId');
      expect(result).toMatchObject({
        ...newNoteDto,
        id: '1',
        createdAt: fixedDate,
        updatedAt: fixedDate,
        userId: 'userId',
      });
    });
  });

  describe('getNote', () => {
    it('should throw error if note not found', async () => {
      (prismaService.note.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(notesService.getNote('noteId', 'userId')).rejects.toThrow(
        new BadRequestException({ message: 'Note not found' }),
      );
    });

    it('should return the note if found', async () => {
      (prismaService.note.findFirst as jest.Mock).mockResolvedValue(existingNote);

      const result = await notesService.getNote('noteId', 'userId');
      expect(result).toEqual(existingNote);
    });
  });

  describe('updateNote', () => {
    it('should throw error if note does not exist', async () => {
      (prismaService.note.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(notesService.updateNote(newNoteDto, 'noteId', 'userId')).rejects.toThrow(
        new BadRequestException({ message: `Note with id 'noteId' not found.` }),
      );
    });

    it('should update the note if it exists', async () => {
      (prismaService.note.findUnique as jest.Mock).mockResolvedValue(existingNote);
      (prismaService.note.update as jest.Mock).mockResolvedValue({
        ...existingNote,
        ...newNoteDto,
        updatedAt: fixedDate,
      });

      const result = await notesService.updateNote(newNoteDto, 'noteId', 'userId');
      expect(result).toMatchObject({
        ...existingNote,
        ...newNoteDto,
        updatedAt: fixedDate,
      });
    });
  });

  describe('deleteNote', () => {
    it('should throw error if note does not exist', async () => {
      (prismaService.note.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(notesService.deleteNote('noteId', 'userId')).rejects.toThrow(
        new BadRequestException({ message: `Note with id 'noteId' not found.` }),
      );
    });

    it('should delete the note if it exists', async () => {
      (prismaService.note.findUnique as jest.Mock).mockResolvedValue(existingNote);
      (prismaService.note.delete as jest.Mock).mockResolvedValue(existingNote);

      const result = await notesService.deleteNote('noteId', 'userId');
      expect(result).toEqual(existingNote);
    });
  });
});
