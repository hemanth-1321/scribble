import axios from "axios";
import { BACKEND_URL } from "../config";

export const createRoom = async (name: string) => {
  try {
    const response = await axios.post(`${BACKEND_URL}/api/room/createroom`, {
      name,
    });
    console.log(response.data);
    if (response.status == 200) {
      return response.data;
    }
    throw new Error("Room creation error");
  } catch (error) {
    console.error("Error creating room", error);
    return null;
  }
};
