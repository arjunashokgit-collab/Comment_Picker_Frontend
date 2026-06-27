// This file allows configuring a custom media image and seeded winner sequence.
// When drawing winners, the users and comments will be picked in this specific order.
import giveawayimage from "./giveaway.png"

export const mediaConfig = {
  // The custom image to display in the frontend when creating/configuring a giveaway
  image: giveawayimage,

  // The sequential usernames to be drawn as winners
  user_id1: 'lucky_user_one',
  user_id2: 'arjun_ashok',
  user_id3: 'blessed_user_three',

  // The custom comments for each seeded winner
  comment1: 'Amazing! I won the first round! 🎉🎁',
  comment2: 'ronaldo',
  comment3: 'Messi',
};
