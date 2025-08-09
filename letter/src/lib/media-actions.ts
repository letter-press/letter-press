import { action } from '@solidjs/router';
import type { APIEvent } from '@solidjs/start/server';
import { db } from '~/lib/db';
import { requireAuth } from '~/lib/auth-utils';
import { 
  MediaUploadSchema,
  MediaUpdateSchema,
  MediaQuerySchema,
  PositiveIntegerSchema,
  type MediaUpload,
  type MediaUpdate,
  type MediaQuery
} from './validation-schemas';
import { 
  createValidatedFormAction,
  validateData,
  unwrapValidation
} from './validation-utils';

// Media upload types
interface MediaUploadResult {
    id: number;
    fileName: string;
    filePath: string;
    fileType: string;
    fileSize: number;
    title?: string;
    caption?: string;
    altText?: string;
    authorId: number;
    createdAt: Date;
    updatedAt: Date;
}

interface MediaUploadError {
    error: string;
    code: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

async function uploadFile(file: File, authorId: number): Promise<MediaUploadResult | MediaUploadError> {
    // Validate file with schema
    const validation = validateData(MediaUploadSchema, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
    });
    
    if (!validation.success) {
        return { error: validation.error, code: 'VALIDATION_ERROR' };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`;
    
    // For now, we'll store files in the public directory
    // In production, you'd want to use a cloud storage service like AWS S3
    const uploadDir = './public/uploads';
    const filePath = `/uploads/${fileName}`;
    const fullPath = `${uploadDir}/${fileName}`;

    try {
        // Ensure upload directory exists
        const fs = await import('fs');
        const path = await import('path');
        
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Write file to disk
        const buffer = await file.arrayBuffer();
        fs.writeFileSync(fullPath, Buffer.from(buffer));

        // Save to database
        const media = await db.media.create({
            data: {
                fileName: file.name,
                filePath,
                fileType: file.type,
                fileSize: file.size,
                title: file.name.split('.')[0], // Default title from filename
                authorId,
            },
        });

        return {
            id: media.id,
            fileName: media.fileName,
            filePath: media.filePath,
            fileType: media.fileType,
            fileSize: media.fileSize,
            title: media.title || undefined,
            caption: media.caption || undefined,
            altText: media.altText || undefined,
            authorId: media.authorId,
            createdAt: media.createdAt,
            updatedAt: media.updatedAt,
        };
    } catch (error) {
        console.error('File upload error:', error);
        return { error: 'Failed to upload file', code: 'UPLOAD_FAILED' };
    }
}

export const uploadMedia = action(async (formData: FormData) => {
    'use server';
    
    try {
        const session = await requireAuth();
        
        const file = formData.get('file') as File;
        if (!file) {
            throw new Error('No file provided');
        }

        const result = await uploadFile(file, Number(session.user.id));
        
        if ('error' in result) {
            throw new Error(result.error);
        }

        return { success: true, media: result };
    } catch (error) {
        console.error('Upload media error:', error);
        throw new Error(error instanceof Error ? error.message : 'Upload failed');
    }
});

export const getMediaLibrary = action(async (options: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
} = {}) => {
    'use server';
    
    try {
        const session = await requireAuth();

        // Validate options
        const validation = validateData(MediaQuerySchema, options, "Media Query");
        
        if (!validation.success) {
            throw new Error(validation.error);
        }

        const { page = 1, limit = 20, search, type } = validation.data;
        const offset = (page - 1) * limit;

        const where: any = {};
        
        if (search) {
            where.OR = [
                { fileName: { contains: search, mode: 'insensitive' } },
                { title: { contains: search, mode: 'insensitive' } },
                { caption: { contains: search, mode: 'insensitive' } },
                { altText: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (type) {
            where.fileType = { startsWith: type };
        }

        const [media, total] = await Promise.all([
            db.media.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: offset,
                take: limit,
                include: {
                    posts: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                        },
                    },
                },
            }),
            db.media.count({ where }),
        ]);

        return {
            media,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1,
            },
        };
    } catch (error) {
        console.error('Get media library error:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to load media');
    }
});

export const updateMedia = action(async (id: number, data: {
    title?: string;
    caption?: string;
    altText?: string;
}) => {
    'use server';
    
    try {
        const session = await requireAuth();

        // Validate inputs
        const idValidation = validateData(PositiveIntegerSchema, id, "Media ID");
        if (!idValidation.success) {
            throw new Error(idValidation.error);
        }
        
        const dataValidation = validateData(MediaUpdateSchema, { id, ...data }, "Media Update");
        if (!dataValidation.success) {
            throw new Error(dataValidation.error);
        }

        const { id: validatedId, ...updateData } = dataValidation.data;

        const media = await db.media.update({
            where: { id: validatedId },
            data: updateData,
        });

        return { success: true, media };
    } catch (error) {
        console.error('Update media error:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to update media');
    }
});

export const deleteMedia = action(async (id: number) => {
    'use server';
    
    try {
        const session = await requireAuth();

        // Validate ID
        const validation = validateData(PositiveIntegerSchema, id, "Media ID");
        if (!validation.success) {
            throw new Error(validation.error);
        }

        const validatedId = validation.data;

        // Get media info for file deletion
        const media = await db.media.findUnique({
            where: { id: validatedId },
        });

        if (!media) {
            throw new Error('Media not found');
        }

        // Delete from database
        await db.media.delete({
            where: { id: validatedId },
        });

        // Delete physical file
        try {
            const fs = await import('fs');
            const fullPath = `./public${media.filePath}`;
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        } catch (fileError) {
            console.warn('Could not delete physical file:', fileError);
            // Don't throw here as the database record is already deleted
        }

        return { success: true };
    } catch (error) {
        console.error('Delete media error:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to delete media');
    }
});