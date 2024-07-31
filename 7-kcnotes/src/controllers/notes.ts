import type { IncomingMessage, ServerResponse } from "node:http";
import { sendSuccess } from "../utils/response";
import { Note } from "../model";
import { checkAuth } from "../middlewares/auth";
import { badRequestError, internalServerError, notFoundError } from "../utils/errors";
import { getUserId } from "../model/auth";
import { STATUS_CODES } from "../constants/types";

export async function getNotes(req: IncomingMessage, res: ServerResponse) {
  sendSuccess(res, { data: { notes: await Note.getNotes() } });
}

export function addNote(req: IncomingMessage, res: ServerResponse) {
  const auth = checkAuth(req, res);
  if (!auth) return;

  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", async () => {
    const userId = getUserId(req);
    const { title, content } = JSON.parse(body);
    if (!title || !content || !userId) {
      return badRequestError(res, "All fields required");
    }
    const note = await Note.addNote({
      title,
      content,
      userId,
    });
    if (!note) {
      return internalServerError(res, "Error creating note");
    }

    sendSuccess(res, {
      statusCode: STATUS_CODES.CREATED,
      data: { note },
    });
  });
}

export async function getNote(req: IncomingMessage, res: ServerResponse) {
  if (!checkAuth(req, res)) return;

  try {
    const urlParts = req.url?.split('/');
    const idString = urlParts?.pop();
    if (!idString) {
      return badRequestError(res, "Note ID is required");
    }

    const id = Number(idString);
    if (isNaN(id)) {
      return badRequestError(res, "Note ID must be a number");
    }

    const userId = getUserId(req);
    console.log(`Retrieved userId: ${userId}`);

    const note = await Note.getUserNotes(id);
    console.log(`Retrieved note: ${JSON.stringify(note)}`);

    if (!note) {
      return notFoundError(res, "Note not found");
    }

    if (note.user_id !== userId) {
      return notFoundError(res, "Note not found");
    }

    sendSuccess(res, {
      statusCode: STATUS_CODES.OK,
      data: { note },
    });
  } catch (error) {
    console.error('Error getting note:', error);
    internalServerError(res, "Error retrieving note");
  }
}

export async function updateNote(req: IncomingMessage, res: ServerResponse) {
  if (!checkAuth(req, res)) return;

  try {
    const urlParts = req.url?.split('/');
    const idString = urlParts?.pop();
    if (!idString) {
      return badRequestError(res, "Note ID is required");
    }

    const id = Number(idString);
    if (isNaN(id)) {
      return badRequestError(res, "Note ID must be a number");
    }

    const userId = getUserId(req);
    console.log(`Retrieved userId: ${userId}`);

    const note = await Note.getUserNotes(id);
    console.log(`Retrieved note: ${JSON.stringify(note)}`);

    if (!note) {
      return notFoundError(res, "Note not found");
    }

    if (note.user_id !== userId) {
      return notFoundError(res, "Note not found");
    }

    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      const { title, content } = JSON.parse(body);
      if (!title || !content) {
        return badRequestError(res, "Title and content are required");
      }

      const updatedNote = await Note.updateNote(id, { title, content });
      if (!updatedNote) {
        return internalServerError(res, "Error updating note");
      }

      sendSuccess(res, {
        statusCode: STATUS_CODES.OK,
        data: { note: updatedNote },
      });
    });
  } catch (error) {
    console.error('Error updating note:', error);
    internalServerError(res, "Error updating note");
  }
}

export async function deleteNote(req: IncomingMessage, res: ServerResponse) {
  if (!checkAuth(req, res)) return;

  try {
    const urlParts = req.url?.split('/');
    const idString = urlParts?.pop();
    if (!idString) {
      return badRequestError(res, "Note ID is required");
    }

    const id = Number(idString);
    if (isNaN(id)) {
      return badRequestError(res, "Note ID must be a number");
    }

    const userId = getUserId(req);
    console.log(`Retrieved userId: ${userId}`);

    const note = await Note.getUserNotes(id);
    console.log(`Retrieved note: ${JSON.stringify(note)}`);

    if (!note) {
      return notFoundError(res, "Note not found");
    }

    if (note.user_id !== userId) {
      return notFoundError(res, "Note not found");
    }

    const deletedNote = await Note.deleteNote(id);
    if (!deletedNote) {
      return internalServerError(res, "Error deleting note");
    }

    sendSuccess(res, {
      statusCode: STATUS_CODES.OK,
      data: { message: "Note deleted successfully" },
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    internalServerError(res, "Error deleting note");
  }
}


