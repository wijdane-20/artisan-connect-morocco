
-- Seed sample artisans and a few clients with reviews
DO $$
DECLARE
  v_uid uuid;
  v_uid2 uuid;
  v_client1 uuid;
  v_client2 uuid;
  v_cat_plombier uuid := '2d449758-3a37-470f-af60-69966c36b1cc';
  v_cat_electricien uuid := 'bf0363fb-a6ee-4edb-b2c1-cb0dc172b1a9';
  v_cat_menuisier uuid := '44930b46-4388-4e5c-8017-ca4ad136731e';
  v_cat_peintre uuid := 'c92dd136-0d3d-4c31-ae7b-802c5c281bdf';
  v_cat_macon uuid := '60d7b3e2-7668-45a8-9f9a-560ada893b3e';
  v_cat_climatisation uuid := '78395a2d-c92a-4ae6-9aa7-fe72011bb4a7';
  v_cat_carreleur uuid := '33d9b476-46a8-4d4e-a31b-7e0d59eda218';
  v_cat_serrurier uuid := '8e66aab6-0a0d-4e2c-940c-ed9a1c547e5e';

  v_artisans uuid[] := ARRAY[]::uuid[];

  artisan_data RECORD;
BEGIN
  -- Helper: insert auth user (triggers handle_new_user)
  FOR artisan_data IN
    SELECT * FROM (VALUES
      ('hassan.plombier@demo.ma', 'Hassan Alaoui', 'Casablanca', 'artisan', v_cat_plombier, 'Plombier certifié, 12 ans d''expérience. Dépannage 7j/7.', ARRAY['Plomberie','Dépannage','Chauffe-eau'], 12, 150.00),
      ('youssef.elec@demo.ma', 'Youssef Bennani', 'Rabat', 'artisan', v_cat_electricien, 'Électricien agréé, installations résidentielles et tertiaires.', ARRAY['Tableau électrique','Domotique','Mise aux normes'], 8, 180.00),
      ('mohamed.menuisier@demo.ma', 'Mohamed Tazi', 'Marrakech', 'artisan', v_cat_menuisier, 'Menuiserie sur mesure, bois massif et MDF.', ARRAY['Cuisine','Dressing','Portes'], 15, 200.00),
      ('amine.peintre@demo.ma', 'Amine Chraibi', 'Casablanca', 'artisan', v_cat_peintre, 'Peinture intérieure et extérieure, finitions décoratives.', ARRAY['Peinture','Enduit','Tadelakt'], 10, 120.00),
      ('karim.macon@demo.ma', 'Karim Idrissi', 'Fès', 'artisan', v_cat_macon, 'Gros œuvre, rénovation et extensions.', ARRAY['Maçonnerie','Rénovation','Extension'], 18, 160.00),
      ('rachid.clim@demo.ma', 'Rachid El Amrani', 'Tanger', 'artisan', v_cat_climatisation, 'Installation et maintenance de climatiseurs split et VRV.', ARRAY['Climatisation','Maintenance','Split'], 7, 220.00),
      ('omar.carreleur@demo.ma', 'Omar Benjelloun', 'Agadir', 'artisan', v_cat_carreleur, 'Pose de carrelage, faïence et zellige traditionnel.', ARRAY['Carrelage','Zellige','Faïence'], 9, 140.00),
      ('said.serrurier@demo.ma', 'Said Lahlou', 'Casablanca', 'artisan', v_cat_serrurier, 'Serrurerie d''urgence 24/7, ouverture de portes et blindage.', ARRAY['Urgence','Blindage','Coffre-fort'], 11, 170.00)
    ) AS t(email, full_name, city, role, category_id, bio, skills, exp, rate)
  LOOP
    v_uid := gen_random_uuid();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', artisan_data.email, crypt('Demo1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', artisan_data.full_name, 'role', artisan_data.role, 'city', artisan_data.city),
      now(), now(), '', '', '', '');

    UPDATE public.artisans SET
      category_id = artisan_data.category_id,
      bio = artisan_data.bio,
      skills = artisan_data.skills,
      experience_years = artisan_data.exp,
      hourly_rate = artisan_data.rate,
      approved = true
    WHERE id = v_uid;

    v_artisans := array_append(v_artisans, v_uid);
  END LOOP;

  -- Sample clients
  v_client1 := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', v_client1, 'authenticated', 'authenticated', 'fatima.client@demo.ma', crypt('Demo1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Fatima Zahra","role":"client","city":"Casablanca"}'::jsonb, now(), now(), '', '', '', '');

  v_client2 := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', v_client2, 'authenticated', 'authenticated', 'samir.client@demo.ma', crypt('Demo1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Samir Belkadi","role":"client","city":"Rabat"}'::jsonb, now(), now(), '', '', '', '');

  -- Insert sample reviews
  INSERT INTO public.reviews (client_id, artisan_id, rating, comment) VALUES
    (v_client1, v_artisans[1], 5, 'Intervention rapide et travail impeccable. Je recommande vivement !'),
    (v_client2, v_artisans[1], 4, 'Très professionnel, ponctuel. Tarif correct.'),
    (v_client1, v_artisans[2], 5, 'Installation parfaite du nouveau tableau électrique. Merci !'),
    (v_client2, v_artisans[3], 5, 'Cuisine sur mesure magnifique, finitions soignées.'),
    (v_client1, v_artisans[4], 4, 'Belle peinture, équipe sérieuse et propre.'),
    (v_client2, v_artisans[5], 5, 'Excellent travail de rénovation, dans les délais.'),
    (v_client1, v_artisans[6], 5, 'Clim installée rapidement, fonctionne parfaitement.'),
    (v_client2, v_artisans[7], 4, 'Pose de zellige superbe, vrai savoir-faire.'),
    (v_client1, v_artisans[8], 5, 'Disponible en pleine nuit, sauvetage assuré !');
END $$;
