package analysis

import (
	"database/sql"
	"strings"

	"bitbucket.org/liamstask/goose/lib/goose"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/datastore"
)

func init() {
	datastore.RegisterMigration(20201005105400, "AnalysisUpstream", func(txn *sql.Tx, conf *goose.DBConf) error {

		createAnalysisTabls := "CREATE TABLE IF NOT EXISTS analysis ("
		createAnalysisTabls += "id             VARCHAR(255) NOT NULL,"
		createAnalysisTabls += "endpoint       VARCHAR(36) NOT NULL,"
		createAnalysisTabls += "endpoint_type  VARCHAR(36) NOT NULL,"
		createAnalysisTabls += "name           VARCHAR(255) NOT NULL,"

		// `user` is a reserved word in postgres. For other DBs the column is renamed into
		// `user_guid` in a subsequent `20201102132553_RenameUserColumn` migration
		if strings.Contains(conf.Driver.Name, "postgres") {
			createAnalysisTabls += "user_guid      VARCHAR(36) NOT NULL,"
		} else {
			createAnalysisTabls += "user           VARCHAR(36) NOT NULL,"
		}

		createAnalysisTabls += "path           VARCHAR(255) NOT NULL,"
		createAnalysisTabls += "type           VARCHAR(64) NOT NULL,"
		createAnalysisTabls += "format         VARCHAR(64) NOT NULL,"
		createAnalysisTabls += "created        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,"
		createAnalysisTabls += "acknowledged   BOOLEAN NOT NULL DEFAULT FALSE,"
		createAnalysisTabls += "status         VARCHAR(16) NOT NULL,"
		createAnalysisTabls += "duration       INT NOT NULL DEFAULT 0,"
		createAnalysisTabls += "result         VARCHAR(255) NOT NULL,"
		createAnalysisTabls += "PRIMARY KEY (id) );"

		_, err := txn.Exec(createAnalysisTabls)
		if err != nil {
			return err
		}

		// createIndex := "CREATE INDEX charts_id ON charts (id);"
		// _, err = txn.Exec(createIndex)
		// if err != nil {
		// 	return err
		// }

		return nil
	})
}
