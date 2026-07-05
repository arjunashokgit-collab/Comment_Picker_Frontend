// This file allows configuring a custom media image and seeded winner sequence.
// When drawing winners, the users and comments will be picked in this specific order.
import image123 from "./image3.png"

export const mediaConfig = {
  // The custom image to display in the frontend when creating/configuring a giveaway
  image: image123,

  // The sequential usernames to be drawn as winners
  user_id1: 'eldho_jose_thomas',
  user_id2: 'mathew_varghese_jnr',
  user_id3: 'anoop_james',

  // The custom comments for each seeded winner
  comment1: 'neymar 🇧🇷',
  comment2: '🇧🇷 ⚽',
  comment3: 'BRAZIL 🇧🇷',
};
