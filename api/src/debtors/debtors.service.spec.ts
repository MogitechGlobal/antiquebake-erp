import { Test, TestingModule } from '@nestjs/testing';
import { DebtorsService } from './debtors.service';

describe('DebtorsService', () => {
  let service: DebtorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DebtorsService],
    }).compile();

    service = module.get<DebtorsService>(DebtorsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
