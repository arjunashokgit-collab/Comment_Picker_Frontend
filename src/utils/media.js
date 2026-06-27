// This file allows configuring a custom media image and seeded winner sequence.
// When drawing winners, the users and comments will be picked in this specific order.

export const mediaConfig = {
  // The custom image to display in the frontend when creating/configuring a giveaway
  image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=8',

  // The sequential usernames to be drawn as winners
  user_id1: 'lucky_user_one',
  user_id2: 'arjun_ashok',
  user_id3: 'blessed_user_three',

  // The custom comments for each seeded winner
  comment1: 'Amazing! I won the first round! 🎉🎁',
  comment2: 'ronaldo',
  comment3: 'Messi',
};
