import * as migrationsDir from '../env/migrationsDir';
import * as migrationsDb from '../env/migrationsDb';

export async function status(profile = 'default', event?: any) {
    const stack = event?.stack ?? 'applicant-portal-api-ap1'
    const migrationsTableName = `${stack}-migrations`
    console.log(`Table: ${migrationsTableName}`)

    const ddb = await migrationsDb.getDdb(profile);
    const fileNamesInMigrationFolder = migrationsDir.getFileNamesInMigrationFolder();

    const migrationsLog = await migrationsDb.getAllMigrations(ddb, migrationsTableName);

    const statusTable = await Promise.all(
        fileNamesInMigrationFolder.map(async (fileName) => {
            const fileNameToSearchInMigrationsLog = { FILE_NAME: fileName };
            const fileMigrated = migrationsLog.find((migrated) => {
                return migrated.FILE_NAME === fileNameToSearchInMigrationsLog.FILE_NAME;
            });
            const appliedAt: string = fileMigrated?.APPLIED_AT ? fileMigrated.APPLIED_AT : 'PENDING';
            return { fileName, appliedAt };
        }),
    );

    return statusTable;
}
