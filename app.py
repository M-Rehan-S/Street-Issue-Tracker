import os
from flask import Flask
from config import Config
from extensions import db, migrate, mysql, cors
from models import user, report, vote, audit_log
from routes import auth_bp, dashboard_bp, api_bp


def create_app(config_class=Config) -> Flask:
    base_dir = os.path.abspath(os.path.dirname(__file__))
    app = Flask(__name__, template_folder=os.path.join(base_dir, 'templates'))
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    mysql.init_app(app)
    cors.init_app(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(api_bp)

    return app


if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        db.create_all()

    app.run(
        debug=True,
        use_reloader=False,  # Reloader forks the process AFTER tf threads start → segfault
        threaded=False,      # TFLite has its own thread pool; Flask threads conflict with it
    )