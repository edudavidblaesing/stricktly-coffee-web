import { exec } from 'child_process';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const s3Endpoint = process.env.S3_ENDPOINT || 'http://minio:9000';
const s3Client = new S3Client({
  endpoint: s3Endpoint,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || 'minio_admin',
    secretAccessKey: process.env.S3_SECRET_KEY || 'minio_secure_password_local_123'
  },
  forcePathStyle: true
});
const s3BucketBackups = process.env.S3_BUCKET_BACKUPS || 'backups';

const dbHost = process.env.DB_HOST || 'postgres-db';
const dbPort = process.env.DB_PORT || '5432';
const dbName = process.env.DB_NAME || 'stricktlycoffee';
const dbUser = process.env.DB_USER || 'sc_admin';
const dbPassword = process.env.DB_PASSWORD || 'sc_secure_password_local_123';

async function runBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilename = `backup-${dbName}-${timestamp}.sql.gz`;
  const backupLocalPath = path.join('/tmp', backupFilename);

  console.log(`[Backup Job] Starting PostgreSQL database backup for database '${dbName}'...`);

  // Form pg_dump command (using pg_dump inside Alpine/PostgreSQL container)
  const pgDumpCmd = `PGPASSWORD="${dbPassword}" pg_dump -h "${dbHost}" -p "${dbPort}" -U "${dbUser}" "${dbName}" | gzip > "${backupLocalPath}"`;

  exec(pgDumpCmd, async (error, stdout, stderr) => {
    if (error) {
      console.error(`[Backup Job] pg_dump failed: ${error.message}`);
      if (process.env.RUN_ONCE === 'true') process.exit(1);
      return;
    }

    console.log(`[Backup Job] Backup created successfully: ${backupLocalPath}`);

    try {
      // Upload the file to S3 backups bucket
      console.log(`[Backup Job] Uploading to S3 bucket '${s3BucketBackups}' as key '${backupFilename}'...`);
      const fileStream = fs.createReadStream(backupLocalPath);
      await s3Client.send(new PutObjectCommand({
        Bucket: s3BucketBackups,
        Key: backupFilename,
        Body: fileStream,
        ContentType: 'application/gzip'
      }));

      console.log('[Backup Job] Upload completed successfully.');

      // Clean up local temp file
      fs.unlinkSync(backupLocalPath);
      console.log('[Backup Job] Local temporary file deleted.');
      
      if (process.env.RUN_ONCE === 'true') {
        process.exit(0);
      }
    } catch (err) {
      console.error('[Backup Job] S3 Upload failed:', err.message);
      if (fs.existsSync(backupLocalPath)) {
        fs.unlinkSync(backupLocalPath);
      }
      if (process.env.RUN_ONCE === 'true') process.exit(1);
    }
  });
}

// First execution
runBackup();

// Schedule periodic backups if not running as a single execution
if (process.env.RUN_ONCE !== 'true') {
  const intervalHours = parseFloat(process.env.BACKUP_INTERVAL_HOURS || '12');
  const intervalMs = intervalHours * 60 * 60 * 1000;
  console.log(`[Backup Job] Daemon active. Scheduled to run database backup every ${intervalHours} hours.`);
  setInterval(runBackup, intervalMs);
}
