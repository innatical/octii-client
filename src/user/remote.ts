import { clientGateway } from '../constants'

type UserResponse = {
  id: string
  avatar: string
  username: string
  discriminator: number
}

export const getUser = async (_: string, userID: string, token: string) =>
  (
    await clientGateway.get<UserResponse>(`/users/${userID}`, {
      headers: {
        Authorization: token
      }
    })
  ).data