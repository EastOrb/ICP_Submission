// cannister code goes here
import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt, Principal } from 'azle';
import random from 'random';

/**
 * This type represents a Medical Record that can be listed on a board.
 */
type MedicalRecord = Record<{
  id: string;
  title: string;
  CreatorId: Principal;
  attachmentURL: string;
  createdAt: nat64;
  updatedAt: Opt<nat64>;
}>;

type MedicalRecordPayload = Record<{
  title: string;
  attachmentURL: string;
}>;

const recordStorage = new StableBTreeMap<string, MedicalRecord>(0, 44, 1024);

$query;
export function getAllRecords(): Result<Vec<MedicalRecord>, string> {
  try {
    const callerId = ic.caller().toString();
    const records = recordStorage.values();
    const filteredRecords = records.filter(record => record.CreatorId.toString() === callerId);
    return Result.Ok(filteredRecords);
  } catch (error) {
    return Result.Err(`Failed to retrieve records: ${error.message}`);
  }
}

$query;
export function getRecord(id: string): Result<MedicalRecord, string> {
  try {
    const callerId = ic.caller().toString();
    const record = recordStorage.get(id);
    if (!record) {
      return Result.Err(`The Record with id=${id} was not found`);
    }
    if (record.CreatorId.toString() !== callerId) {
      return Result.Err('Only the creator can update the Record');
    }
    return Result.Ok(record);
  } catch (error) {
    return Result.Err(`Failed to retrieve the record: ${error.message}`);
  }
}

$query;
export function getCaller(): Result<Principal, string> {
  try {
    const callerId = ic.caller();
    return Result.Ok(callerId);
  } catch (error) {
    return Result.Err(`Failed to retrieve the caller: ${error.message}`);
  }
}

$query;
export function getCreatorId(id: string): Result<Principal, string> {
  try {
    const record = recordStorage.get(id);
    if (!record) {
      return Result.Err(`The Record with id=${id} was not found`);
    }
    const creatorId = record.CreatorId;
    return Result.Ok(creatorId);
  } catch (error) {
    return Result.Err(`Failed to retrieve the creatorId: ${error.message}`);
  }
}

$update;
export function addRecord(payload: MedicalRecordPayload): Result<MedicalRecord, string> {
  try {
    const callerId = ic.caller();
    const record: MedicalRecord = {
      id: generateRandomString(30),
      CreatorId: callerId,
      createdAt: ic.time(),
      updatedAt: Opt.None,
      ...payload
    };
    recordStorage.insert(record.id, record);
    return Result.Ok(record);
  } catch (error) {
    return Result.Err(`Failed to add the record: ${error.message}`);
  }
}

$update;
export function updateRecord(id: string, payload: MedicalRecordPayload): Result<MedicalRecord, string> {
  try {
    const callerId = ic.caller().toString();
    const record = recordStorage.get(id);
    if (!record) {
      return Result.Err(`The Record with id=${id} was not found`);
    }
    if (record.CreatorId.toString() !== callerId) {
      return Result.Err('Only the creator can update the Record');
    }
    const updatedRecord: MedicalRecord = {
      ...record,
      ...
      payload,
      updatedAt: Opt.Some(ic.time())
    };
    recordStorage.insert(record.id, updatedRecord);
    return Result.Ok(updatedRecord);
  } catch (error) {
    return Result.Err(`Failed to update the record: ${error.message}`);
  }
}

$update;
export function deleteRecord(id: string): Result<MedicalRecord, string> {
  try {
    const callerId = ic.caller().toString();
    const record = recordStorage.get(id);
    if (!record) {
      return Result.Err(`The Record with id=${id} was not found`);
    }
    if (record.CreatorId.toString() !== callerId) {
      return Result.Err('Only the creator can delete the Record');
    }
    recordStorage.remove(id);
    return Result.Ok(record);
  } catch (error) {
    return Result.Err(`Failed to delete the record: ${error.message}`);
  }
}

function generateRandomString(length: number): string {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomString = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = random.int(0, characters.length - 1);
    randomString += characters[randomIndex];
  }
  return randomString;
}
