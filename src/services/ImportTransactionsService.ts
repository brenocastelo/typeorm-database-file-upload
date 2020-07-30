import csvParse from 'csv-parse';
import fs from 'fs';

import Transaction from '../models/Transaction';
import { getCustomRepository, getRepository, In } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface TransactionCsv {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const categoryRepository = getRepository(Category);
    const transactionRepository = getCustomRepository(TransactionsRepository);

    const contactsReadStream = fs.createReadStream(filePath);

    const transactions: TransactionCsv[] = [];
    const categories: string[] = [];

    const parsers = csvParse({
      from_line: 2,
    });

    const parseCsv = contactsReadStream.pipe(parsers);

    parseCsv.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !value || !type) return;

      categories.push(category);
      transactions.push({ title, value, type, category });
    });

    await new Promise(resolve => parseCsv.on('end', resolve));

    const existentCategories = await categoryRepository.find({
      where: {
        title: In(categories),
      },
    });

    const existentCategoriesTitles = existentCategories.map(
      (category: Category) => category.title,
    );

    const categoriesToAddOnDatabase = categories
      .filter(
        (category: string) => !existentCategoriesTitles.includes(category),
      )
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoryRepository.create(
      categoriesToAddOnDatabase.map(title => ({ title })),
    );

    await categoryRepository.save(newCategories);

    const addedCategories = [...newCategories, ...existentCategories];

    const newTansactions = transactionRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: addedCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionRepository.save(newTansactions);

    return newTansactions;
  }
}

export default ImportTransactionsService;
