
import api from "./api.js";

const getMyMessages = async () => {
  const response = await api.get("/messages/my");
  return response.data;
};

const simulateMessageStatus = async (messageId, status) => {
  const response = await api.patch(
    `/messages/${messageId}/simulate-status`,
    { status }
  );

  return response.data;
};

const messageService = {
  getMyMessages,
  simulateMessageStatus,
};

export default messageService;

