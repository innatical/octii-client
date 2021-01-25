import axios from 'axios'

export const CLIENT_GATEWAY_URL = process.env.REACT_APP_GATEWAY_URL
export const clientGateway = axios.create({
  baseURL: CLIENT_GATEWAY_URL
})

export enum ModalTypes {
  ADD_PARTICIPANT,
  DELETE_MESSAGE,
  INCOMING_CALL,
  NEW_COMMUNITY,
  NEW_CONVERSATION,
  NEW_PERMISSION,
  PREVIEW_IMAGE,
  STATUS
}

export enum Groups {
  BASIC,
  MOD,
  ADMIN
}

export enum Permissions {
  READ_MESSAGES = 1,
  SEND_MESSAGES = 2,
  EMBED_LINKS = 3,
  MENTION_MEMBERS = 4,
  MENTION_GROUPS = 5,
  MENTION_EVERYONE = 6,
  MENTION_SOMEONE = 7,
  CREATE_INVITES = 8,
  BAN_MEMBERS = 9,
  KICK_MEMBERS = 10,
  MANAGE_PERMISSIONS = 11,
  MANAGE_CHANNELS = 12,
  MANAGE_INVITES = 13,
  MANAGE_SERVER = 14,
  MANAGE_MESSAGES = 15,
  ADMINISTRATOR = 16,
  OWNER = 17
}

export const PermissionsGroups: { [key in Groups]: Permissions[] } = {
  [Groups.BASIC]: [
    Permissions.READ_MESSAGES,
    Permissions.SEND_MESSAGES,
    Permissions.MENTION_MEMBERS,
    Permissions.MENTION_GROUPS,
    Permissions.MENTION_SOMEONE,
    Permissions.EMBED_LINKS,
    Permissions.CREATE_INVITES
  ],
  [Groups.MOD]: [
    Permissions.BAN_MEMBERS,
    Permissions.KICK_MEMBERS,
    Permissions.MENTION_EVERYONE,
    Permissions.MANAGE_PERMISSIONS,
    Permissions.MANAGE_CHANNELS,
    Permissions.MANAGE_INVITES,
    Permissions.MANAGE_MESSAGES
  ],
  [Groups.ADMIN]: [
    Permissions.MANAGE_SERVER,
    Permissions.ADMINISTRATOR,
    Permissions.OWNER
  ]
}

export const PermissionNames = {
  [Permissions.READ_MESSAGES]: 'Read Messages',
  [Permissions.SEND_MESSAGES]: 'Send Messages',
  [Permissions.MENTION_MEMBERS]: 'Mention Members',
  [Permissions.MENTION_GROUPS]: 'Mention Groups',
  [Permissions.MENTION_SOMEONE]: 'Mention Someone',
  [Permissions.EMBED_LINKS]: 'Embed Links',
  [Permissions.CREATE_INVITES]: 'Create Invites',
  [Permissions.BAN_MEMBERS]: 'Ban Members',
  [Permissions.KICK_MEMBERS]: 'Kick Members',
  [Permissions.MENTION_EVERYONE]: 'Mention Everyone',
  [Permissions.MANAGE_PERMISSIONS]: 'Manage Permissions',
  [Permissions.MANAGE_CHANNELS]: 'Manage Channels',
  [Permissions.MANAGE_INVITES]: 'Manage Invites',
  [Permissions.MANAGE_MESSAGES]: 'Manage Messages',
  [Permissions.MANAGE_SERVER]: 'Manage Server',
  [Permissions.ADMINISTRATOR]: 'Administator',
  [Permissions.OWNER]: 'Owner'
}

export const GroupNames: { [key in Groups]: string } = {
  [Groups.BASIC]: 'Basic Permissions',
  [Groups.MOD]: 'Mod Permissions',
  [Groups.ADMIN]: 'Admin Permissions'
}

export enum Events {
  ACCEPTED_VOICE_SESSION = 'ACCEPTED_VOICE_SESSION',
  DELETED_CHANNEL = 'DELETED_CHANNEL',
  DELETED_GROUP = 'DELETED_GROUP',
  DELETED_MEMBER = 'DELETED_MEMBER',
  DELETED_MESSAGE = 'DELETED_MESSAGE',
  DELETED_PARTICIPANT = 'DELETED_PARTICIPANT',
  NEW_CHANNEL = 'NEW_CHANNEL',
  NEW_GROUP = 'NEW_GROUP',
  NEW_MEMBER = 'NEW_MEMBER',
  NEW_MESSAGE = 'NEW_MESSAGE',
  NEW_PARTICIPANT = 'NEW_PARTICIPANT',
  NEW_VOICE_SESSION = 'NEW_VOICE_SESSION',
  TYPING = 'TYPING',
  UPDATED_CONVERSATION = 'UPDATED_CONVERSATION',
  UPDATED_GROUP = 'UPDATED_GROUP',
  UPDATED_MESSAGE = 'UPDATED_MESSAGE',
  UPDATED_USER = 'UPDATED_USER',
  NEW_MENTION = 'NEW_MENTION'
}

export enum MessageTypes {
  NORMAL = 1,
  PINNED = 2,
  MEMBER_ADDED = 3,
  MEMBER_REMOVED = 4,
  ADMINISTRATOR = 5
}

export enum ChannelTypes {
  PrivateChannel,
  GroupChannel,
  CommunityChannel
}
