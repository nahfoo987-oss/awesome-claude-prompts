import { z } from 'zod'

export const appointmentSchema = z.object({
  customer_name: z.string().min(2, 'Name must be at least 2 characters').max(80),
  customer_phone: z
    .string()
    .min(10, 'Enter a valid phone number')
    .max(20)
    .regex(/^[\d\s\+\-\(\)\.]+$/, 'Enter a valid phone number'),
  customer_email: z
    .string()
    .email('Enter a valid email address')
    .optional()
    .or(z.literal('')),
  service: z.enum(['Any Cut — $30'], { required_error: 'Select a service' }),
  date: z.string().min(1, 'Select a date'),
  time: z.string().min(1, 'Select a time'),
  notes: z.string().max(500).optional(),
})

export type AppointmentFormData = z.infer<typeof appointmentSchema>

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export type LoginFormData = z.infer<typeof loginSchema>
