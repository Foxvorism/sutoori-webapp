insert into public.services (slug,name,description,sort_order) values
 ('photography','Photography / Graduation Photoshoots','Portraits, milestones, and the people behind them. Keep the feeling long after the day.',0),
 ('sports','Sports Photography & Documentation','The movement, the energy, the decisive moment. Stories from the sidelines and beyond.',1),
 ('events','Event Documentation','Photography and video that hold on to the atmosphere, from the big stage to the small details.',2),
 ('weddings','Wedding Documentation','Honest moments and considered images, woven into a story that is yours.',3),
 ('film','Videography & Company Profiles','Purposeful moving images that introduce your people, your ideas, and your world.',4),
 ('design','Graphic Design','A clear visual voice, from the first concept to the final design.',5),
 ('yearbook','Yearbook Production','A chapter worth keeping. Concept, photography, layout, and printed output where quoted.',6),
 ('photobooth','On-site / Events Photobooth','A little spontaneity. A shared memory. A photobooth experience made for your event.',7),
 ('social','Social Media Content & Motion Graphics','Visual stories made to move, connect, and feel at home on your channels.',8)
on conflict (slug) do nothing;
insert into public.site_settings (id,headline,supporting_copy,about,process,whatsapp,message_template,email,instagram) values
 (1,'Creating Stories. Timeless Moments.','Photography, film, and creative production — from the first idea to the final frame.',
 'Student-founded. Story-driven. We are a creative team bringing fresh perspectives to schools, campuses, communities, and brands across Bogor–Jabodetabek. From a fleeting moment to a lasting impression, we make it together.',
 '[{"title":"Discover","description":"Every story starts with a conversation. We align on your vision, audience, and the moments that matter."},{"title":"Create","description":"Ideas take shape. We develop the concept, design direction, and production plan."},{"title":"Produce","description":"Our team brings it to life — on set, on location, and behind the scenes."},{"title":"Deliver","description":"The finishing touches. Thoughtful editing and final output, ready for your next chapter."}]',
 '6281213280154','Hi Sutoori! I''d like to discuss a project.','sutooriproduction@gmail.com','https://www.instagram.com/sutoori.co/')
on conflict (id) do nothing;
