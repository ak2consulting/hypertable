import sys
import time
from hypertable.thriftclient import *
from hyperthrift.gen.ttypes import *

try:
  client = ThriftClient("localhost", 38080)
  print "HQL examples"

  try:
    namespace = client.open_namespace("bad")
  except:
    print "Caught exception when tyring to open 'bad' namespace"

  namespace = client.open_namespace("test")
  res = client.hql_query(namespace, "show tables")
  print res
  res = client.hql_query(namespace, "select * from thrift_test")
  print res

  print "mutator examples";
  mutator = client.open_mutator(namespace, "thrift_test", 0, 0);
  client.set_cell(mutator, Cell(Key("py-k1", "col", None), "py-v1"))
  client.flush_mutator(mutator);
  
  print "shared mutator examples";
  mutate_spec = MutateSpec("test_py", 1000, 0);
  client.offer_cell(namespace, "thrift_test", mutate_spec, Cell(Key("py-put-k1", "col", None), "py-put-v1"))
  client.refresh_shared_mutator(namespace, "thrift_test", mutate_spec)
  client.offer_cell(namespace, "thrift_test", mutate_spec, Cell(Key("py-put-k2", "col", None), "py-put-v2"))
  time.sleep(2)

  print "scanner examples";
  scanner = client.open_scanner(namespace, "thrift_test",
                                ScanSpec(None, None, None, 1), True);

  while True:
    cells = client.next_cells(scanner)
    if (len(cells) == 0):
      break
    print cells

  client.close_namespace(namespace)
except:
  print sys.exc_info()
  raise
