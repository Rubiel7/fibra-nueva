CREATE TABLE `fibra_distributions` (
  `ticker` text PRIMARY KEY NOT NULL,
  `latest_distribution` real,
  `distribution_currency` text DEFAULT 'MXN' NOT NULL,
  `distribution_period` text NOT NULL,
  `payment_frequency` text NOT NULL,
  `annualized_distribution` real,
  `quarterly_affo_per_cbfi` real,
  `quality` text NOT NULL,
  `note` text,
  `fiscal_note` text,
  `fundamentals_as_of` text DEFAULT '2T26' NOT NULL,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `fibra_distributions` (`ticker`,`latest_distribution`,`distribution_currency`,`distribution_period`,`payment_frequency`,`annualized_distribution`,`quarterly_affo_per_cbfi`,`quality`,`note`,`fiscal_note`,`fundamentals_as_of`,`updated_at`) VALUES
('FUNO11',0.6398,'MXN','2T26','Trimestral',2.5592,NULL,'verified',NULL,NULL,'2T26',1789686000000),
('FIHO12',0.1555,'MXN','2T26','Trimestral',0.6220,0.1457,'verified','Atención: la distribución 2T26 superó su AFFO',NULL,'2T26',1789686000000),
('FINN13',0.09,'MXN','2T26','Trimestral',0.3600,NULL,'verified',NULL,NULL,'2T26',1789686000000),
('FMTY14',0.07592,'MXN','2T26','Mensual',0.91104,NULL,'verified','⚠ Dato distorsionado','Los CBFIs de la colocación de marzo están en el denominador, pero solo se consolidó un mes desde el 29-may-2026.','2T26',1789686000000),
('FNOVA17',0.6216,'MXN','2T26','Trimestral',2.4864,NULL,'verified',NULL,NULL,'2T26',1789686000000),
('FIBRAMQ12',0.2042,'MXN','jul-2026','Mensual desde jul-2026',2.4504,NULL,'verified',NULL,NULL,'2T26',1789686000000),
('EDUCA18',0.6514,'MXN','2T26','Trimestral',2.6056,NULL,'verified',NULL,NULL,'2T26',1789686000000),
('FIBRAPL14',0.7314,'MXN','2T26','Trimestral en efectivo',2.9256,NULL,'verified',NULL,'La distribución anual incluye una parte en especie; el yield usa únicamente el pago en efectivo y no debe mostrarse como 7.55%.','2T26',1789686000000),
('STORAGE18',0.9052,'MXN','mar-2026','Anual · un pago en marzo',0.9052,NULL,'verified',NULL,NULL,'2T26',1789686000000),
('FCFE18',0.61883,'MXN','2T26','Trimestral',2.47532,NULL,'verified',NULL,NULL,'2T26',1789686000000),
('DANHOS13',0.45,'MXN','2T26','Trimestral',1.80,NULL,'verified',NULL,'Cada pago se divide entre resultado fiscal y reembolso de capital.','2T26',1789686000000),
('FSHOP13',NULL,'MXN','2T26','Trimestral',NULL,NULL,'unverified','Discrepancia abierta: $0.8162 vs $0.78; no se estima hasta verificar el aviso 2T26 en BMV.',NULL,'2T26',1789686000000),
('FMX23',NULL,'MXN','2T26','Mensual',NULL,NULL,'unverified','Distribución mensual no verificada en BIVA; sin yield estimado.',NULL,'2T26',1789686000000),
('FPLUS16',NULL,'MXN','Suspendida','Suspendida',0,NULL,'no_distributions','SIN DISTRIBUCIONES',NULL,'2T26',1789686000000),
('FIBRAUP18',0.55,'USD','Histórico','Pago único',NULL,NULL,'single_payment','PAGO ÚNICO — NO COMPARABLE','Pago único de USD$0.55 en su historia; queda fuera del ranking.','2T26',1789686000000);