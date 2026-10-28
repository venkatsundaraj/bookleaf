import z from "zod";

export const userValidation = z.object({
  email: z.email().min(1),
  password: z.string().min(6),
});

// The author and admin login pages each send the role they expect,
// so an author can't sign in through the admin page and vice versa.
export const loginValidation = userValidation.extend({
  role: z.enum(["admin", "author"]),
});

export type userValidationType = z.infer<typeof userValidation>;
