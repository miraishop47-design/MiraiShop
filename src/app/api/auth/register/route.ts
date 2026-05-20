import { NextResponse } from 'next/server';
import { AuthRepositoryImpl } from '@/infrastructure/repositories/AuthRepositoryImpl';
import { RegisterUseCase } from '@/application/use-cases/RegisterUseCase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role } = body;

    const authRepository = new AuthRepositoryImpl();
    const registerUseCase = new RegisterUseCase(authRepository);

    const user = await registerUseCase.execute(name, email, password, role || 'customer');

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
