import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

export default {
  storage: multer.diskStorage({
    destination: path.resolve(__dirname, '..', '..', 'tmp'),
    filename: (request, file, callback) => {
      const fileNameHash = crypto.randomBytes(8).toString('hex');
      const fileName = `${fileNameHash}-${file.originalname}`;

      return callback(null, fileName);
    },
  }),
};
