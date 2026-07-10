import { Test, TestingModule } from '@nestjs/testing';
import { DebtorsController } from './debtors.controller';

describe('DebtorsController', () => {
  let controller: DebtorsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DebtorsController],
    }).compile();

    controller = module.get<DebtorsController>(DebtorsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
