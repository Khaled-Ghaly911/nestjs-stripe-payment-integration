import 'dotenv/config';

import bcrypt from 'bcryptjs';
import { AppDataSource } from '../data-source';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';

const usersData = [
  { email: 'ahmed@example.com' },
  { email: 'mohamed@example.com' },
  { email: 'sara@example.com' },
  { email: 'omar@example.com' },
  { email: 'nour@example.com' },
];

const productsData = [
  {
    name: 'Complete NestJS Backend Course',
    description: 'Build production-ready backend applications using NestJS.',
    price: 4999,
    isActive: true,
  },
  {
    name: 'Advanced TypeScript Masterclass',
    description:
      'Deep dive into TypeScript types, generics, and advanced patterns.',
    price: 3499,
    isActive: true,
  },
  {
    name: 'Node.js Performance Guide',
    description: 'A practical guide to building fast Node.js applications.',
    price: 1999,
    isActive: true,
  },
  {
    name: 'PostgreSQL for Backend Developers',
    description:
      'Learn database design, indexing, transactions, and optimization.',
    price: 2999,
    isActive: true,
  },
  {
    name: 'System Design Fundamentals',
    description: 'Understand scalable systems and backend architecture.',
    price: 3999,
    isActive: true,
  },
  {
    name: 'Clean Code with TypeScript',
    description:
      'Practical principles for writing maintainable TypeScript code.',
    price: 2499,
    isActive: true,
  },
  {
    name: 'Docker for Developers',
    description: 'Learn containers, images, networks, and Docker Compose.',
    price: 1999,
    isActive: true,
  },
  {
    name: 'Redis in Practice',
    description: 'Caching, data structures, and performance optimization.',
    price: 1799,
    isActive: true,
  },
  {
    name: 'GraphQL Complete Guide',
    description:
      'Build GraphQL APIs with queries, mutations, and subscriptions.',
    price: 3299,
    isActive: true,
  },
  {
    name: 'REST API Design Handbook',
    description: 'Design consistent, secure, and maintainable REST APIs.',
    price: 1499,
    isActive: true,
  },
  {
    name: 'Microservices Architecture',
    description:
      'Learn service boundaries, communication, and distributed systems.',
    price: 4499,
    isActive: true,
  },
  {
    name: 'Git and GitHub Essentials',
    description:
      'A practical guide to version control and collaborative development.',
    price: 999,
    isActive: true,
  },
  {
    name: 'Software Architecture Patterns',
    description: 'Explore common architecture patterns and when to use them.',
    price: 2799,
    isActive: true,
  },
  {
    name: 'JavaScript Internals',
    description:
      'Understand execution context, closures, event loop, and more.',
    price: 2299,
    isActive: true,
  },
  {
    name: 'Async JavaScript Deep Dive',
    description: 'Master promises, async/await, and concurrent operations.',
    price: 1699,
    isActive: true,
  },
  {
    name: 'Practical SQL Queries',
    description: 'Improve your SQL skills through realistic database problems.',
    price: 1299,
    isActive: true,
  },
  {
    name: 'Database Indexing Guide',
    description: 'Understand indexes and query execution plans.',
    price: 1899,
    isActive: true,
  },
  {
    name: 'Authentication and Authorization',
    description: 'Implement JWT, sessions, RBAC, and secure authentication.',
    price: 2599,
    isActive: true,
  },
  {
    name: 'Web Security Essentials',
    description: 'Learn common web vulnerabilities and practical defenses.',
    price: 2199,
    isActive: true,
  },
  {
    name: 'Unit Testing with Jest',
    description:
      'Write reliable unit and integration tests for Node.js applications.',
    price: 1799,
    isActive: true,
  },
  {
    name: 'CI/CD Pipeline Starter Kit',
    description: 'Ready-to-use templates for automated testing and deployment.',
    price: 1499,
    isActive: true,
  },
  {
    name: 'Backend Developer Interview Guide',
    description:
      'Technical questions and practical backend interview preparation.',
    price: 999,
    isActive: true,
  },
  {
    name: 'Software Engineering E-book',
    description: 'A practical introduction to software engineering principles.',
    price: 799,
    isActive: true,
  },
  {
    name: 'UML and System Design Templates',
    description: 'Reusable diagrams and templates for software documentation.',
    price: 1199,
    isActive: true,
  },
  {
    name: 'API Documentation Template',
    description: 'Professional API documentation templates and examples.',
    price: 699,
    isActive: true,
  },
  {
    name: 'Advanced NestJS Architecture',
    description:
      'Organize large NestJS applications with maintainable patterns.',
    price: 3799,
    isActive: true,
  },
  {
    name: 'Stripe Integration Workshop',
    description:
      'Build a payment integration with PaymentIntents and webhooks.',
    price: 2999,
    isActive: true,
  },
  {
    name: 'Production Logging and Monitoring',
    description: 'Implement structured logging and application monitoring.',
    price: 1899,
    isActive: true,
  },
  {
    name: 'Legacy Node.js Migration Guide',
    description:
      'A practical guide to modernizing existing Node.js applications.',
    price: 1599,
    isActive: false,
  },
  {
    name: 'Advanced Database Optimization',
    description:
      'Advanced database performance techniques and query optimization.',
    price: 4999,
    isActive: false,
  },
];

async function seedUsers(): Promise<void> {
  const repository = AppDataSource.getRepository(User);
  const passwordHash: string = await bcrypt.hash('DevPassword123!', 10);
  for (const userData of usersData) {
    const existingUser = await repository.findOneBy({
      email: userData.email,
    });

    if (existingUser) {
      continue;
    }

    const user = repository.create({
      ...userData,
      passwordHash,
    });

    await repository.save(user);
  }

  console.log(`Users seeded: ${usersData.length}`);
}

async function seedProducts(): Promise<void> {
  const repository = AppDataSource.getRepository(Product);

  for (const productData of productsData) {
    const existingProduct = await repository.findOneBy({
      name: productData.name,
    });

    if (existingProduct) {
      continue;
    }

    const product = repository.create({
      ...productData,
      currency: 'usd',
    });

    await repository.save(product);
  }

  console.log(`Products processed: ${productsData.length}`);
}

async function seed(): Promise<void> {
  try {
    await AppDataSource.initialize();

    console.log('Database connected.');

    await seedUsers();
    await seedProducts();

    console.log('Seeding completed successfully.');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

void seed();
