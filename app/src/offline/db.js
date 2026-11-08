import { openDB } from 'idb';

const DB_NAME = 'vecired_offline';
const DB_VERSION = 1;
export const OUTBOX_STORE = 'outbox';

/**
 * Inicializa y retorna la conexión a la base de datos IndexedDB 'vecired_offline'
 * con el almacén de objetos 'outbox'.
 */
export const initDB = () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(OUTBOX_STORE)) {
        db.createObjectStore(OUTBOX_STORE, {
          keyPath: 'id',
          autoIncrement: true,
        });
      }
    },
  });
};
