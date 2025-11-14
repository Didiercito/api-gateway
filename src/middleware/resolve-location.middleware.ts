import axios from 'axios';
import { Request, Response, NextFunction } from 'express';

export const resolveUserLocation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authorization header missing' 
      });
    }

    const authURL = process.env.AUTH_USER_SERVICE_URL + '/api/v1/users/profile';

    const profileResponse = await axios.get(authURL, {
      headers: { Authorization: authorization }
    });

    const user = profileResponse.data.data.user;

    if (!user.stateId || !user.municipalityId) {
      return res.status(400).json({
        success: false,
        message: 'User does not have stateId or municipalityId assigned'
      });
    }

    req.query.stateId = String(user.stateId);
    req.query.municipalityId = String(user.municipalityId);

    next();

  } catch (error: any) {
    console.error('resolveUserLocation error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error resolving user location',
      error: error.message,
    });
  }
};
