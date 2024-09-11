const { DataTypes, Model } = require('sequelize');

class AuthorCombinedAlias extends Model {
  constructor(values, options) {
    super(values, options)

    /** @type {UUIDV4} */
    this.id;
    /** @type {UUIDV4} */
    this.authorId;
    /** @type {UUIDV4} */
    this.aliasId;
    /** @type {Date} */
    this.createdAt;
  }

  static removeByIds(authorId = null, aliasId = null) {
    const where = {}
    if (authorId) where.authorId = authorId;
    if (aliasId) where.aliasId = aliasId;
    return this.destroy({
      where
    });
  }

  /**
   * Initialize model
   * @param {import('../Database').sequelize} sequelize
   */
  static init(sequelize) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        authorId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'authors',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        aliasId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'authors',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
      },
      {
        sequelize,
        modelName: 'authorCombinedAlias',
        timestamps: true,
        updatedAt: false,
      }
    );

    const { author } = sequelize.models;

    // Each author can have many combined aliases (one-to-many relationship)
    author.hasMany(AuthorCombinedAlias, {
      foreignKey: 'authorId',
    });
    AuthorCombinedAlias.belongsTo(author, {
      foreignKey: 'authorId',
    });

    // Each alias can be shared by multiple authors
    author.hasMany(AuthorCombinedAlias, {
      foreignKey: 'aliasId',
    });
    AuthorCombinedAlias.belongsTo(author, {
      foreignKey: 'aliasId',
    });
  }
}
module.exports = AuthorCombinedAlias
