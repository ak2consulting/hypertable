/**
 * Copyright (C) 2007 Doug Judd (Zvents, Inc.)
 * 
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */

#include <cassert>

#include "Error.h"

using namespace std;
using namespace hypertable;

namespace {
  typedef struct {
    uint32_t     code;
    const char  *text;
  } ErrorInfoT;

  ErrorInfoT errorInfo[] = {
    { Error::OK,                          "HYPERTABLE ok" },
    { Error::PROTOCOL_ERROR,              "HYPERTABLE protocol error" },
    { Error::REQUEST_TRUNCATED,           "HYPERTABLE request truncated" },
    { Error::RESPONSE_TRUNCATED,          "HYPERTABLE response truncated" },
    { Error::REQUEST_TIMEOUT,             "HYPERTABLE request timeout" },
    { Error::LOCAL_IO_ERROR,              "HYPERTABLE local i/o error" },
    { Error::COMM_NOT_CONNECTED,          "COMM not connected" },
    { Error::COMM_BROKEN_CONNECTION,      "COMM broken connection" },
    { Error::COMM_CONNECT_ERROR,          "COMM connect error" },
    { Error::COMM_ALREADY_CONNECTED,      "COMM already connected" },
    { Error::COMM_REQUEST_TIMEOUT,        "COMM request timeout" },
    { Error::HDFSBROKER_BAD_FILE_HANDLE,  "HDFS BROKER bad file handle" },
    { Error::HDFSBROKER_IO_ERROR,         "HDFS BROKER i/o error" },
    { Error::HDFSBROKER_FILE_NOT_FOUND,   "HDFS BROKER file not found" },
    { Error::HYPERTABLEFS_IO_ERROR,       "HYPERTABLE FS i/o error" },
    { Error::HYPERTABLEFS_CREATE_FAILED,  "HYPERTABLE FS create failed" },
    { Error::HYPERTABLEFS_FILE_NOT_FOUND, "HYPERTABLE FS file not found" },
    { Error::HYPERTABLEFS_ATTR_NOT_FOUND, "HYPERTABLE FS attribute not found" },
    { Error::MASTER_TABLE_EXISTS,         "HYPERTABLE MASTER table exists" },
    { Error::MASTER_BAD_SCHEMA,           "HYPERTABLE MASTER bad schema" },
    { Error::RANGESERVER_GENERATION_MISMATCH,  "RANGE SERVER generation mismatch" },
    { Error::RANGESERVER_RANGE_ALREADY_LOADED, "RANGE SERVER range already loaded" },
    { Error::RANGESERVER_RANGE_MISMATCH,       "RANGE SERVER range mismatch" },
    { Error::RANGESERVER_NONEXISTENT_RANGE,    "RANGE SERVER non-existent range" },
    { Error::RANGESERVER_PARTIAL_UPDATE,       "RANGE SERVER partial update" },
    { Error::RANGESERVER_RANGE_NOT_FOUND,      "RANGE SERVER range not found" },
    { Error::RANGESERVER_INVALID_SCANNER_ID,   "RANGE SERVER invalid scanner id" },
    { Error::RANGESERVER_SCHEMA_PARSE_ERROR,   "RANGE SERVER schema parse error" },
    { 0, 0 }
  };

  typedef __gnu_cxx::hash_map<uint32_t, const char *>  TextMapT;

  TextMapT &buildTextMap() {
    TextMapT *map = new TextMapT();
    for (int i=0; errorInfo[i].text != 0; i++)
      (*map)[errorInfo[i].code] = errorInfo[i].text;
    return *map;
  }

  TextMapT &textMap = buildTextMap();
}


const int Error::OK;
const int Error::PROTOCOL_ERROR;
const int Error::REQUEST_TRUNCATED;
const int Error::RESPONSE_TRUNCATED;
const int Error::REQUEST_TIMEOUT;
const int Error::LOCAL_IO_ERROR;

const int Error::COMM_NOT_CONNECTED;
const int Error::COMM_BROKEN_CONNECTION;
const int Error::COMM_CONNECT_ERROR;
const int Error::COMM_ALREADY_CONNECTED;
const int Error::COMM_REQUEST_TIMEOUT;

const int Error::HDFSBROKER_BAD_FILE_HANDLE;
const int Error::HDFSBROKER_IO_ERROR;
const int Error::HDFSBROKER_FILE_NOT_FOUND;

const int Error::HYPERTABLEFS_IO_ERROR;
const int Error::HYPERTABLEFS_CREATE_FAILED;
const int Error::HYPERTABLEFS_FILE_NOT_FOUND;
const int Error::HYPERTABLEFS_ATTR_NOT_FOUND;

const int Error::MASTER_TABLE_EXISTS;
const int Error::MASTER_BAD_SCHEMA;

const int Error::RANGESERVER_GENERATION_MISMATCH;
const int Error::RANGESERVER_RANGE_ALREADY_LOADED;
const int Error::RANGESERVER_RANGE_MISMATCH;
const int Error::RANGESERVER_NONEXISTENT_RANGE;
const int Error::RANGESERVER_PARTIAL_UPDATE;
const int Error::RANGESERVER_RANGE_NOT_FOUND;
const int Error::RANGESERVER_INVALID_SCANNER_ID;
const int Error::RANGESERVER_SCHEMA_PARSE_ERROR;

const char *Error::GetText(int error) {
  const char *text = textMap[error];
  if (text == 0)
    return "ERROR NOT REGISTERED";
  return text;
}