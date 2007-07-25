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


#ifndef HYPERTABLE_IOHANDLER_H
#define HYPERTABLE_IOHANDLER_H

extern "C" {
#include <errno.h>
#include <sys/types.h>
#include <sys/time.h>
#if defined(__APPLE__)
#include <sys/event.h>
#endif
#if defined(__linux__)
#include <sys/epoll.h>
#endif
}

#include "Common/Logger.h"

#include "CallbackHandler.h"
#include "EventQueue.h"
#include "ReactorFactory.h"

namespace hypertable {

  class ConnectionMap;

  /**
   *
   */
  class IOHandler {

  public:

    IOHandler(int sd, CallbackHandler *cbh, ConnectionMap &cm, EventQueue *eq) : mSd(sd), mCallback(cbh), mConnMap(cm), mEventQueue(eq) {
      mReactor = ReactorFactory::GetReactor();
      mPollInterest = 0;
    }

#if defined(__APPLE__)
    virtual bool HandleEvent(struct kevent *event) = 0;
#elif defined(__linux__)
    virtual bool HandleEvent(struct epoll_event *event) = 0;
#else
    ImplementMe;
#endif

    virtual ~IOHandler() { return; }

    void DeliverEvent(Event *event, CallbackHandler *cbh=0) {
      CallbackHandler *handler = (cbh == 0) ? mCallback : cbh;
      if (handler == 0) {
	LOG_VA_INFO("%s", event->toString().c_str());
	delete event;
      }
      else {
	EventPtr eventPtr(event);
	if (mEventQueue)
	  mEventQueue->Add(eventPtr, handler);
	else
	  handler->handle(eventPtr);
      }
    }

    void StartPolling() {
#if defined(__APPLE__)
      AddPollInterest(Reactor::READ_READY);
#elif defined(__linux__)
      struct epoll_event event;
      memset(&event, 0, sizeof(struct epoll_event));
      event.data.ptr = this;
      event.events = EPOLLIN | EPOLLERR | EPOLLHUP;
      if (epoll_ctl(mReactor->pollFd, EPOLL_CTL_ADD, mSd, &event) < 0) {
	LOG_VA_ERROR("epoll_ctl(%d, EPOLL_CTL_ADD, %d, EPOLLIN|EPOLLERR|EPOLLHUP) failed : %s",
		     mReactor->pollFd, mSd, strerror(errno));
	exit(1);
      }
      mPollInterest |= Reactor::READ_READY;
#endif
    }

    void AddPollInterest(int mode);

    void RemovePollInterest(int mode);

    int GetSd() { return mSd; }

    Reactor *GetReactor() { return mReactor; }

  protected:
    int            mSd;
    CallbackHandler *mCallback;
    ConnectionMap &mConnMap;
    EventQueue    *mEventQueue;
    Reactor       *mReactor;
    int            mPollInterest;

#if defined(__APPLE__)
    void DisplayEvent(struct kevent *event);
#elif defined(__linux__)
    void DisplayEvent(struct epoll_event *event);
#endif
  };

}


#endif // HYPERTABLE_IOHANDLER_H