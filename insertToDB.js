import { createRxDatabase } from 'rxdb/plugins/core';
import { getRxStorageLocalstorage } from 'rxdb/plugins/storage-localstorage';
import steelData from './steels.json' with { type: 'json' };


const steelSchema = {
    title: 'knife steel schema',
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        name: { type: 'string' },
        toughness: { type: 'number' },
        corrosion: { type: 'number' },
        retention: { type: 'number' },
        sharpening: { type: 'number' }
    },
    required: ['id', 'name', 'toughness', 'corrosion', 'retention', 'sharpening']
};

const main = async () =>{

  // 1. Create Database
  console.log("Initializing Persistent LocalStorage Database...");

  const db = await createRxDatabase({
    name: 'mydatabase',
    storage: getRxStorageLocalstorage()
  });


  // 2. Add Collection
  await db.addCollections({
      steels: { schema: steelSchema }
  });

  // 3. The Big Consolidated Data
  // const steelData = [
  //   { "id": "m390", "name": "M390", "toughness": 3, "corrosion": 9, "retention": 9, "sharpening": 2 },
  //   { "id": "14c28n", "name": "14C28N", "toughness": 9, "corrosion": 8, "retention": 4, "sharpening": 9 },
  //   { "id": "nitro-v", "name": "Nitro-V", "toughness": 8, "corrosion": 8, "retention": 4, "sharpening": 8 },
  //   { "id": "magnacut", "name": "MagnaCut", "toughness": 7, "corrosion": 10, "retention": 8, "sharpening": 5 },
  //   { "id": "elmax", "name": "ELMAX", "toughness": 5, "corrosion": 8, "retention": 8, "sharpening": 3 },
  //   { "id": "vg10", "name": "VG10", "toughness": 4, "corrosion": 7, "retention": 6, "sharpening": 6 },
  //   { "id": "aus10", "name": "AUS10", "toughness": 5, "corrosion": 7, "retention": 6, "sharpening": 7 },
  //   { "id": "ar-rpm9", "name": "AR-RPM9", "toughness": 6, "corrosion": 7, "retention": 5, "sharpening": 8 },
  //   { "id": "aus8", "name": "AUS8", "toughness": 6, "corrosion": 6, "retention": 3, "sharpening": 9 },
  //   { "id": "8cr13mov", "name": "8Cr13MoV", "toughness": 5, "corrosion": 5, "retention": 3, "sharpening": 9 }
  // ];

  // 4. Upsert (to prevent duplicates on rerun)
  console.log('Syncing steels to local storage...');
  await Promise.all(steelData.map(s => db.steels.atomicUpsert(s)));
  const result = await db.steels.find().exec();
  console.log(`Database is live! Stored steels: ${result.length}`);
  console.log("Check your folder for 'knifesteels_db.sqlite'");

  // 5. Test Query
  const topSteels = await db.steels.find().where('corrosion').gt(7).exec();
  console.log('Steels with corrosion resistance > 7:', topSteels.map(s => s.name));

  // 6. Close DB
  await db.close();
};

main().catch(err => console.error('Error:', err));
