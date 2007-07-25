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

#include "ReactorFactory.h"
#include "ReactorRunner.h"
using namespace hypertable;

#include <cassert>

extern "C" {
#include <signal.h>
}

vector<Reactor *> ReactorFactory::msReactors;
atomic_t ReactorFactory::msNextReactor = ATOMIC_INIT(0);



/**
 * Method to initialize the reactor factory
 *
 * @param reactorCount number of reactors to initialize
 */
void ReactorFactory::Initialize(uint16_t reactorCount) {
  Reactor *reactor;
  ReactorRunner rrunner;
  signal(SIGPIPE, SIG_IGN);
  assert(reactorCount > 0);
  for (uint16_t i=0; i<reactorCount; i++) {
    reactor = new Reactor();
    msReactors.push_back(reactor);
    rrunner.SetReactor(reactor);
    reactor->threadPtr = new boost::thread(rrunner);
  }
}
