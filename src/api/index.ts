import { Request, Response } from 'express';

export const slowApi = async (req: Request, res: Response) => {
  // Simulate a slow API response
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  res.json({ message: "This response took 2 seconds to complete!" });
};