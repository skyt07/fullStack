from app.db.session import engine
from app.db.session import Base
from app.models import models  # noqa
target_metadata = Base.metadata
def run_migrations_offline(): pass
def run_migrations_online(): pass
# if context.is_offline_mode(): run_migrations_offline()
# else: run_migrations_online()
