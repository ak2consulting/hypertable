/**
 * Copyright 2007 Doug Judd (Zvents, Inc.)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at 
 *
 * http://www.apache.org/licenses/LICENSE-2.0 
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


package org.hypertable.HdfsBroker;

import org.apache.hadoop.fs.Path;

import java.nio.ByteBuffer;
import java.io.IOException;
import java.io.FileNotFoundException;
import java.net.ProtocolException;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.logging.Logger;
import java.util.logging.Level;

import org.hypertable.AsyncComm.Comm;
import org.hypertable.AsyncComm.CommBuf;
import org.hypertable.AsyncComm.Event;
import org.hypertable.AsyncComm.Message;
import org.hypertable.AsyncComm.MessageBuilderSimple;

import org.hypertable.Common.Error;


public class RequestMkdirs extends Request {

    public RequestMkdirs(OpenFileMap ofmap, Event event) throws ProtocolException {
	super(ofmap, event);

	if ((mFilename = CommBuf.DecodeString(event.msg.buf)) == null)
	    throw new ProtocolException("Filename not properly encoded in request packet");

    }

    public void run() {
	int error;
	CommBuf cbuf = null;
	MessageBuilderSimple mbuilder = new MessageBuilderSimple();

	try {

	    if (Global.verbose)
		log.info("Making directory '" + mFilename + "'");

	    if (!Global.fileSystem.mkdirs(new Path(mFilename)))
		throw new IOException("Problem creating directory '" + mFilename + "'");

	    cbuf = new CommBuf(mbuilder.HeaderLength() + 6);
	    cbuf.PrependShort(Protocol.COMMAND_CREATE);
	    cbuf.PrependInt(Error.OK);

	    // Encapsulate with Comm message response header
	    mbuilder.LoadFromMessage(mEvent.msg);
	    mbuilder.Encapsulate(cbuf);
	    
	    if ((error = Global.comm.SendResponse(mEvent.addr, cbuf)) != Error.OK)
		log.log(Level.SEVERE, "Comm.SendResponse returned " + Error.GetText(error));
	    return;
	}
	catch (IOException e) {
	    e.printStackTrace();
	    cbuf = Global.protocol.CreateErrorMessage(Protocol.COMMAND_OPEN, Error.HDFSBROKER_IO_ERROR,
						      e.getMessage(), mbuilder.HeaderLength());
	}

	// Encapsulate with Comm message response header
	mbuilder.LoadFromMessage(mEvent.msg);
	mbuilder.Encapsulate(cbuf);

	if ((error = Global.comm.SendResponse(mEvent.addr, cbuf)) != Error.OK)
	    log.log(Level.SEVERE, "Comm.SendResponse returned " + Error.GetText(error));
	
    }

    private String    mFilename;
}