const AUTH_API_URL =
  process.env.NEXT_PUBLIC_AUTH_API_URL;

interface LoginDto {
  email: string;
  password: string;
}

interface VerifyOtpDto {
  email: string;
  otp: string;
}

interface AuthResponse {
  success: boolean;
  message?: string;
  access_token?: string;
  refresh_token?: string;
  user?: {
    id: number;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  };
}

export const authApi = {
  async login(data: LoginDto): Promise<AuthResponse> {
    const res = await fetch(`${AUTH_API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Login failed");
    }

    return res.json();
  },

  async verifyOtp(data: VerifyOtpDto): Promise<AuthResponse> {
    const res = await fetch(`${AUTH_API_URL}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Verification failed");
    }

    return res.json();
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const res = await fetch(`${AUTH_API_URL}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      throw new Error("Token refresh failed");
    }

    return res.json();
  },

  async logout(token: string): Promise<void> {
    await fetch(`${AUTH_API_URL}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async getProfile(token: string): Promise<any> {
    const res = await fetch(`${AUTH_API_URL}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.json();
  },
};
