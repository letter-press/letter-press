import { json } from "@solidjs/router";
import { db } from "~/lib/db";
import argon2 from "argon2";
import { 
  UserRegistrationSchema,
  type UserRegistration
} from "~/lib/validation-schemas";
import { 
  createValidatedAPIHandler,
  createErrorResponse,
  createSuccessResponse
} from "~/lib/validation-utils";

export const POST = createValidatedAPIHandler(
  UserRegistrationSchema,
  async (data: UserRegistration) => {
    const { email, password, name } = data;

    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const hashedPassword = await argon2.hash(password);

    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
      }
    });

    return { user };
  },
  { 
    contextName: "User Registration",
    successStatus: 201
  }
);