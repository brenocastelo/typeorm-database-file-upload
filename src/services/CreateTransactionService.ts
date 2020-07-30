import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import { getCustomRepository, getRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface Request {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category: newCategory,
  }: Request): Promise<Transaction> {
    const transactionsRespository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    const balance = await transactionsRespository.getBalance();

    if (type === 'outcome' && value > balance.total) {
      throw new AppError("You don't have enough money");
    }

    let category = await categoryRepository.findOne({
      where: { title: newCategory },
    });

    if (!category) {
      category = categoryRepository.create({ title: newCategory });
      await categoryRepository.save(category);
    }

    const transaction = transactionsRespository.create({
      title,
      value,
      type,
      category_id: category.id,
    });

    await transactionsRespository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
