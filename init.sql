CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `object_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `object_fields` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_type_id` int(11) NOT NULL,
  `label` varchar(100) NOT NULL,
  `field_key` varchar(50) NOT NULL,
  `input_type` enum('text','number','date','mac','ip','select','boolean') NOT NULL DEFAULT 'text',
  `options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`options`)),
  `is_required` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_type_key` (`object_type_id`,`field_key`),
  KEY `fk_of_type` (`object_type_id`),
  CONSTRAINT `fk_of_type` FOREIGN KEY (`object_type_id`) REFERENCES `object_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `objects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `object_type_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data`)),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_objects_type` (`object_type_id`),
  CONSTRAINT `fk_obj_type` FOREIGN KEY (`object_type_id`) REFERENCES `object_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `object_types` (`id`, `name`, `sort_order`) VALUES
(1, 'Switch', 1),
(2, 'Écran', 2),
(3, 'Serveur', 3),
(4, 'Ordinateur', 4),
(5, 'Clavier', 5),
(6, 'Souris', 6);

INSERT INTO `object_fields` (`object_type_id`, `label`, `field_key`, `input_type`, `options`, `is_required`, `sort_order`) VALUES
(1, 'Adresse MAC', 'adresse_mac', 'mac', NULL, 0, 1),
(1, 'Adresse IP', 'adresse_ip', 'ip', NULL, 0, 2),
(1, 'Modèle', 'modele', 'text', NULL, 0, 3),
(1, 'Numéro de série', 'numero_de_serie', 'text', NULL, 0, 4),
(1, 'Nombre de ports', 'nombre_de_ports', 'number', NULL, 0, 5),
(1, 'Emplacement', 'emplacement', 'text', NULL, 0, 6),
(1, 'État', 'etat', 'select', '["En service","En réserve","En maintenance","Réformé"]', 0, 7),
(2, 'Taille (pouces)', 'taille', 'number', NULL, 0, 1),
(2, 'Résolution', 'resolutions', 'select', '["1366x768","1920x1080 (Full HD)","2560x1440 (QHD)","3840x2160 (4K)"]', 0, 2),
(2, 'Modèle', 'modele', 'text', NULL, 0, 3),
(2, 'Numéro de série', 'numero_de_serie', 'text', NULL, 0, 4),
(2, 'Emplacement', 'emplacement', 'text', NULL, 0, 5),
(2, 'État', 'etat', 'select', '["En service","En réserve","En maintenance","Réformé"]', 0, 6),
(3, 'Adresse IP', 'adresse_ip', 'ip', NULL, 1, 1),
(3, 'Adresse MAC', 'adresse_mac', 'mac', NULL, 0, 2),
(3, 'Système d\'exploitation', 'os', 'text', NULL, 0, 3),
(3, 'Processeur', 'cpu', 'text', NULL, 0, 4),
(3, 'Mémoire RAM', 'ram', 'text', NULL, 0, 5),
(3, 'Stockage', 'stockage', 'text', NULL, 0, 6),
(3, 'Numéro de série', 'numero_de_serie', 'text', NULL, 0, 7),
(3, 'Emplacement', 'emplacement', 'text', NULL, 0, 8),
(3, 'État', 'etat', 'select', '["En service","En réserve","En maintenance","Réformé"]', 0, 9),
(4, 'Adresse MAC', 'adresse_mac', 'mac', NULL, 0, 1),
(4, 'Adresse IP', 'adresse_ip', 'ip', NULL, 0, 2),
(4, 'Système d\'exploitation', 'os', 'text', NULL, 0, 3),
(4, 'Processeur', 'cpu', 'text', NULL, 0, 4),
(4, 'Mémoire RAM', 'ram', 'text', NULL, 0, 5),
(4, 'Utilisateur', 'utilisateur', 'text', NULL, 0, 6),
(4, 'Numéro de série', 'numero_de_serie', 'text', NULL, 0, 7),
(4, 'Emplacement', 'emplacement', 'text', NULL, 0, 8),
(4, 'État', 'etat', 'select', '["En service","En réserve","En maintenance","Réformé"]', 0, 9),
(5, 'Type de clavier', 'type_clavier', 'select', '["AZERTY","QWERTY"]', 0, 1),
(5, 'Connectivité', 'connectivite', 'select', '["USB","Fil sans fil","Bluetooth","PS/2"]', 0, 2),
(5, 'Numéro de série', 'numero_de_serie', 'text', NULL, 0, 3),
(5, 'Emplacement', 'emplacement', 'text', NULL, 0, 4),
(5, 'État', 'etat', 'select', '["En service","En réserve","En maintenance","Réformé"]', 0, 5),
(6, 'Connectivité', 'connectivite', 'select', '["USB","Fil sans fil","Bluetooth","PS/2"]', 0, 1),
(6, 'Nombre de boutons', 'nombre_de_boutons', 'number', NULL, 0, 2),
(6, 'Numéro de série', 'numero_de_serie', 'text', NULL, 0, 3),
(6, 'Emplacement', 'emplacement', 'text', NULL, 0, 4),
(6, 'État', 'etat', 'select', '["En service","En réserve","En maintenance","Réformé"]', 0, 5);