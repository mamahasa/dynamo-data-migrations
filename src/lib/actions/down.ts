import * as AWS from '@aws-sdk/client-dynamodb';
import pEachSeries from 'p-each-series';
import { status } from './status';
import * as migrationsDir from '../env/migrationsDir';
import * as migrationsDb from '../env/migrationsDb';

export async function down(profile = 'default', downShift = 1, migrationsTableName: string, dryRun: boolean) {
    const downgraded: string[] = [];
    const statusItems = await status(profile, migrationsTableName);
    const appliedItems = statusItems.filter((item) => item.appliedAt !== 'PENDING');
    const ddb = await migrationsDb.getDdb(profile);

    const rolledBackItem = async (item: { fileName: string; appliedAt: string }) => {
        await executeDown(ddb, item, migrationsTableName);
        downgraded.push(item.fileName);
    };

    await pEachSeries(
        appliedItems.slice(-(downShift === 0 ? appliedItems.length : downShift)).reverse(),
        rolledBackItem,
    );

    return downgraded;
}

async function executeDown(ddb: AWS.DynamoDB, file: { fileName: string; appliedAt: string }, migrationsTableName: string) {
    try {
        const migration = await migrationsDir.loadFilesToBeMigrated(file.fileName);
        const migrationDown = migration.down;
        await migrationDown(ddb);
    } catch (error) {
        const e = error as Error;
        throw new Error(`Could not migrate down ${file.fileName}: ${e.message}`);
    }
    try {
        await migrationsDb.deleteMigrationFromMigrationsLogDb(file, ddb, migrationsTableName);
    } catch (error) {
        const e = error as Error;
        throw new Error(`Could not update migrationsLogDb: ${e.message}`);
    }
}
