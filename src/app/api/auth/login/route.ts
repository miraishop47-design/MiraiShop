import { NextResponse } from 'next/server';
import { AuthRepositoryImpl } from '@/infrastructure/repositories/AuthRepositoryImpl';
import { LoginUseCase } from '@/application/use-cases/LoginUseCase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const authRepository = new AuthRepositoryImpl();
    const loginUseCase = new LoginUseCase(authRepository);

    const user = await loginUseCase.execute(email, password);

    // En un sistema real aquí se generaría un JWT y se guardaría en cookies
    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
