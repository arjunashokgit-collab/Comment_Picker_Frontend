// This file allows configuring a custom media image and seeded winner sequence.
// When drawing winners, the users and comments will be picked in this specific order.
import giveawayimage from "./giveaway.png"

export const mediaConfig = {
  // The custom image to display in the frontend when creating/configuring a giveaway
  image: giveawayimage,

  // The sequential usernames to be drawn as winners
  user_id1: 'methealenthomas',
  user_id2: 'manumathewwss',
  user_id3: 'anoop_james',

  // The custom comments for each seeded winner
  comment1: '🇦🇷🇦🇷',
  comment2: 'Cr7 🇵🇹',
  comment3: 'Messi 🇦🇷',
};
