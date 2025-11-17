import { type Request, type Response, type NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { storage } from './storage';

// Extend Express session to include user
declare module 'express-session' {
  interface SessionData {
    userId: number;
    username: string;
  }
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string | null;
    displayName: string | null;
    role: string;
  };
}

// Middleware to check if user is authenticated
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const user = await storage.getUserById(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: 'User not found' });
    }

    (req as AuthenticatedRequest).user = user;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Authentication error' });
  }
}

// Optional auth middleware - attaches user if logged in but doesn't require it
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.session?.userId) {
    try {
      const user = await storage.getUserById(req.session.userId);
      if (user) {
        (req as AuthenticatedRequest).user = user;
      }
    } catch (error) {
      console.error('Optional auth error:', error);
    }
  }
  next();
}

// Helper function to hash passwords
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Helper function to verify passwords
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Signup handler
export async function signup(req: Request, res: Response) {
  try {
    const { username, password, email, displayName } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    if (username.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if username already exists
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const user = await storage.createUser({
      username,
      password: hashedPassword,
      email: email || null,
      displayName: displayName || username,
      role: 'member',
    });

    // Create default preferences for the user
    await storage.createUserPreferences({
      userId: user.id,
      pauseDuration: 5,
      noPause: false,
      autoRepeat: false,
      autoRepeatAyah: false,
      lastSurah: 1,
      lastAyah: 1,
      language: 'en',
    });

    // Set session
    req.session.userId = user.id;
    req.session.username = user.username;

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({ 
      user: userWithoutPassword,
      message: 'Account created successfully'
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Failed to create account' });
  }
}

// Login handler
export async function login(req: Request, res: Response) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Get user by username
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Set session
    req.session.userId = user.id;
    req.session.username = user.username;

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    res.json({ 
      user: userWithoutPassword,
      message: 'Logged in successfully'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
}

// Logout handler
export async function logout(req: Request, res: Response) {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
}

// Get current user handler
export async function getCurrentUser(req: Request, res: Response) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const user = await storage.getUserById(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get user' });
  }
}
